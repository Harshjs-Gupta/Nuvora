import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ProductModel from "@/lib/models/Product";

// Combined Amazon + MongoDB product search.
// Both sources use Amazon-compatible product field names.

export async function GET(request: NextRequest) {
  const searchTerm = request.nextUrl.searchParams.get("searchTerm")?.trim();

  if (!searchTerm) {
    return NextResponse.json(
      { error: "Please provide a search term." },
      { status: 400 },
    );
  }

  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");

  if (!Number.isSafeInteger(page) || page < 1 || page > 10000) {
    return NextResponse.json({ error: "Invalid page." }, { status: 400 });
  }

  const apiKey = process.env.RAPIDAPI_KEY;

  const params = new URLSearchParams({
    query: searchTerm,
    page: String(page),
    country: "IN",
    sort_by: "RELEVANCE",
    product_condition: "ALL",
  });

  // Escape special regex characters supplied by the user.
  const safeSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Search only using the new Amazon-compatible schema.
  const filter = {
    isActive: true,
    product_title: {
      $regex: safeSearch,
      $options: "i",
    },
  };

  const [amazon, mongo] = await Promise.allSettled([
    // ==========================================
    // AMAZON PRODUCTS
    // ==========================================
    (async () => {
      if (!apiKey) {
        throw new Error("RAPIDAPI_KEY is not configured.");
      }

      const response = await fetch(
        `https://real-time-amazon-data.p.rapidapi.com/search?${params}`,
        {
          headers: {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": "real-time-amazon-data.p.rapidapi.com",
          },
          next: { revalidate: 3600 },
        },
      );

      if (!response.ok) {
        throw new Error(`Amazon returned status ${response.status}.`);
      }

      const data = await response.json();

      if (!Array.isArray(data.data?.products)) {
        throw new Error("Invalid Amazon API response.");
      }

      return {
        products: data.data.products.map(
          (product: Record<string, unknown>) => ({
            ...product,
            source: "amazon",
          }),
        ),
        total: Number(data.data.total_products) || 0,
      };
    })(),

    // ==========================================
    // NUVORA / MONGODB PRODUCTS
    // ==========================================
    (async () => {
      await dbConnect();

      const [records, total] = await Promise.all([
        ProductModel.find(filter)
          .sort({ createdAt: -1, _id: -1 })
          .skip((page - 1) * 20)
          .limit(20)
          .lean(),

        ProductModel.countDocuments(filter),
      ]);

      const products = records.map((product) => ({
        ...product,

        // NUVORA products use MongoDB IDs, not real Amazon ASINs.
        asin: product.asin || `mongo_${String(product._id)}`,

        // Keep all product fields consistent with the Amazon API.
        product_url: product.product_url || `/product/${product.product_slug}`,

        source: "mongodb" as const,
      }));

      return {
        products,
        total,
      };
    })(),
  ]);

  // If both providers fail, return an error.
  if (amazon.status === "rejected" && mongo.status === "rejected") {
    console.error("Both product sources failed:", amazon.reason, mongo.reason);

    return NextResponse.json(
      { error: "Failed to fetch data." },
      { status: 502 },
    );
  }

  // If one provider fails, still return results from the other.
  const amazonProducts =
    amazon.status === "fulfilled" ? amazon.value.products : [];

  const mongoProducts =
    mongo.status === "fulfilled" ? mongo.value.products : [];

  const amazonTotal = amazon.status === "fulfilled" ? amazon.value.total : 0;

  const mongoTotal = mongo.status === "fulfilled" ? mongo.value.total : 0;

  // Interleave products from both sources.
  const result: Record<string, unknown>[] = [];

  for (
    let i = 0;
    i < Math.max(amazonProducts.length, mongoProducts.length);
    i++
  ) {
    if (mongoProducts[i]) {
      result.push(mongoProducts[i]);
    }

    if (amazonProducts[i]) {
      result.push(amazonProducts[i]);
    }
  }

  return NextResponse.json({
    totalProducts: amazonTotal + mongoTotal,
    keyword: searchTerm,
    result,
    page,
    sourceStatus: {
      amazon: amazon.status,
      mongodb: mongo.status,
    },
  });
}
