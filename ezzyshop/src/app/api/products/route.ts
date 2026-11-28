import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Product from "@/lib/models/Product";

// IMPORTANT: apply your existing admin authentication/authorization to POST.
// Do not expose product creation to anonymous users.
export function productFields(body: Record<string, unknown>) {
  const title = String(body.product_title ?? "").trim();
  const slug = String(body.product_slug ?? "").trim().toLowerCase();
  const description = String(body.product_description ?? "").trim();
  const photos = Array.isArray(body.product_photos)
    ? body.product_photos.filter((v): v is string => typeof v === "string" && !!v) : [];
  const photo = String(body.product_photo ?? photos[0] ?? "");
  const category = body.category as { id?: string; name?: string } | undefined;
  const stock = Number(body.stock);
  const parseAmount = (v: unknown) => {
    if (typeof v !== "string" || !/^₹[\d,]+(?:\.\d{1,2})?$/.test(v)) return NaN;
    return Number(v.slice(1).replace(/,/g, ""));
  };
  const price = parseAmount(body.product_price);
  const original = body.product_original_price == null ? null : parseAmount(body.product_original_price);
  if (!title || !slug || !description || !photo || !photos.includes(photo) ||
      !category?.id || !category.name || !Number.isSafeInteger(stock) || stock < 0 ||
      !Number.isFinite(price) || price < 0 ||
      (original !== null && (!Number.isFinite(original) || original < 0))) {
    throw new Error("Invalid product fields");
  }
  return {
    product_title: title, product_slug: slug, product_description: description,
    product_price: body.product_price as string,
    product_original_price: body.product_original_price as string | null,
    product_photo: photo, product_photos: photos,
    product_byline: String(body.product_byline ?? ""),
    category: { id: category.id, name: category.name },
    stock, sku: String(body.sku ?? ""),
    isFeatured: body.isFeatured === true,
    tags: Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === "string") : [],
    product_availability: stock ? "In Stock" : "Out of Stock",
    about_product: [description],
    currency: "INR", country: "IN", domain: "nuvora", source: "mongodb" as const,
  };
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const q = request.nextUrl.searchParams;
    const page = Math.max(1, Math.min(10000, Number(q.get("page")) || 1));
    const limit = Math.max(1, Math.min(100, Number(q.get("limit")) || 20));
    const filter: Record<string, unknown> = { isActive: true };
    if (q.get("category")) filter["category.id"] = q.get("category");
    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
    return NextResponse.json({ products, total, page, limit });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // TODO: enforce your existing server-side admin authorization here.
  try {
    await dbConnect();
    const fields = productFields(await request.json());
    const _id = new Types.ObjectId();
    const product = await Product.create({
      ...fields, _id, asin: `mongo_${_id.toString()}`,
      product_url: `/product/${fields.product_slug}`,
      product_star_rating: "0", product_num_ratings: 0,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid product" }, { status: 400 });
  }
}
