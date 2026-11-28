import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import ProductModel from "@/lib/models/Product";

const RAPIDAPI_HOST = "real-time-amazon-data.p.rapidapi.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchID = searchParams.get("searchID")?.trim();

  if (!searchID) {
    return NextResponse.json(
      { error: "Please provide a product ID or ASIN." },
      { status: 400 },
    );
  }

  const isMongoPrefixed = searchID.startsWith("mongo_");

  try {
    // 1. Check MongoDB first; isolate errors so Amazon ASINs still fall back to RapidAPI.
    try {
      await dbConnect();

      const mongoID = isMongoPrefixed
        ? searchID.slice("mongo_".length)
        : searchID;

      const conditions: Record<string, unknown>[] = [
        { asin: searchID },
        { product_slug: searchID },
      ];

      if (mongoose.Types.ObjectId.isValid(mongoID)) {
        conditions.push({ _id: mongoID });
      }

      const mongoProduct = await ProductModel.findOne({
        $or: conditions,
        isActive: true,
      }).lean();

      if (mongoProduct) {
        const product = {
          ...mongoProduct,
          asin: mongoProduct.asin || `mongo_${String(mongoProduct._id)}`,
          product_url:
            mongoProduct.product_url || `/product/${mongoProduct.product_slug}`,
        };

        // Keep a response shape similar to RapidAPI.
        return NextResponse.json({
          status: "OK",
          data: product,
          source: "mongodb",
        });
      }

      if (isMongoPrefixed) {
        return NextResponse.json(
          { error: "Product not found.", source: "mongodb" },
          { status: 404 },
        );
      }
    } catch (mongoError) {
      console.error("MongoDB product lookup error:", mongoError);

      if (isMongoPrefixed) {
        return NextResponse.json(
          {
            error: "Failed to fetch product details from database.",
            source: "mongodb",
          },
          { status: 503 },
        );
      }
    }

    // 2. If it isn't in MongoDB (or MongoDB is unavailable), try Amazon RapidAPI.
    const apiKey = process.env.RAPIDAPI_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "RAPIDAPI_KEY is not configured." },
        { status: 500 },
      );
    }

    const params = new URLSearchParams({
      country: "IN",
      autoselect_variant: "true",
      asin: searchID,
    });

    const response = await fetch(
      `https://${RAPIDAPI_HOST}/product-details?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": RAPIDAPI_HOST,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      const errorDetails = await response.text();

      console.error("RapidAPI Error:", response.status, errorDetails);

      return NextResponse.json(
        {
          error: "Failed to fetch product details.",
          source: "amazon",
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      ...data,
      source: "amazon",
    });
  } catch (error) {
    console.error("Product details error:", error);

    return NextResponse.json(
      { error: "Failed to fetch product details." },
      { status: 500 },
    );
  }
}
