import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Review from "@/lib/models/Review";
import Product from "@/lib/models/Product";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";

const ReviewSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().min(3).max(100),
  body: z.string().min(10).max(2000),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 10;

  if (!productId) return NextResponse.json({ error: "productId required." }, { status: 400 });

  await connectDB();
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find({ product: productId })
      .populate("user", "name image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ product: productId }),
  ]);

  return NextResponse.json({ reviews, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json();
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { productId, rating, title, body: reviewBody } = parsed.data;

  await connectDB();

  // Check for duplicate
  const existing = await Review.findOne({ product: productId, user: session.user.id });
  if (existing) return NextResponse.json({ error: "You already reviewed this product." }, { status: 409 });

  const review = await Review.create({
    product: productId,
    user: session.user.id,
    rating,
    title,
    body: reviewBody,
  });

  // Recalculate product rating
  const stats = await Review.aggregate([
    { $match: { product: review.product } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  if (stats.length) {
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(stats[0].avg * 10) / 10,
      reviewCount: stats[0].count,
    });
  }

  return NextResponse.json(review, { status: 201 });
}
