
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/lib/models/Product";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import mongoose from "mongoose";

// GET /api/products/[id] — by MongoDB id or product slug
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);

    const product = await Product.findOne({
      $or: [
        ...(isObjectId ? [{ _id: id }] : []),
        { product_slug: id },
      ],
      isActive: true,
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (err) {
    console.error("GET product error:", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// PATCH /api/products/[id] — admin only
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;
    const body = await req.json();

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 }
      );
    }

    // Only accept fields that belong to the unified product schema.
    const allowedFields = [
      "product_title",
      "product_slug",
      "product_description",
      "product_price",
      "product_original_price",
      "product_photo",
      "product_photos",
      "product_star_rating",
      "product_num_ratings",
      "product_url",
      "product_byline",
      "about_product",
      "product_availability",
      "product_condition",
      "category",
      "stock",
      "sku",
      "isFeatured",
      "isActive",
      "tags",
      "currency",
      "country",
      "domain",
    ] as const;

    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        updates[field] = body[field];
      }
    }

    // Keep the primary image consistent with the image list.
    if (Array.isArray(updates.product_photos)) {
      if (!Object.prototype.hasOwnProperty.call(updates, "product_photo")) {
        updates.product_photo =
          (updates.product_photos as string[])[0] ?? "";
      }
    }

    // Validate price strings before saving.
    for (const field of [
      "product_price",
      "product_original_price",
    ] as const) {
      const value = updates[field];

      if (
        value !== undefined &&
        value !== null &&
        (typeof value !== "string" || value.trim() === "")
      ) {
        return NextResponse.json(
          { error: `${field} must be a non-empty price string or null.` },
          { status: 400 }
        );
      }
    }

    // Generate a NUVORA product URL when the slug changes.
    if (typeof updates.product_slug === "string") {
      updates.product_url = `/product/${updates.product_slug}`;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (err) {
    console.error("PATCH product error:", err);

    if (
      err instanceof mongoose.Error.ValidationError
    ) {
      return NextResponse.json(
        { error: err.message },
        { status: 400 }
      );
    }

    if (
      err instanceof mongoose.mongo.MongoServerError &&
      err.code === 11000
    ) {
      return NextResponse.json(
        { error: "A product with this slug or ASIN already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] — admin only (soft delete)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const { id } = await params;

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid product ID." },
        { status: 400 }
      );
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Product deactivated.",
    });
  } catch (err) {
    console.error("DELETE product error:", err);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
