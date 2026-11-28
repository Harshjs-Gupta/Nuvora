import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Review from "@/lib/models/Review";
import Product from "@/lib/models/Product";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  await connectDB();

  const review = await Review.findById(id);
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  if (review.user.toString() !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  Object.assign(review, body);
  await review.save();

  // Recalculate rating
  const stats = await Review.aggregate([
    { $match: { product: review.product } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  if (stats.length) {
    await Product.findByIdAndUpdate(review.product, {
      rating: Math.round(stats[0].avg * 10) / 10,
      reviewCount: stats[0].count,
    });
  }

  return NextResponse.json(review);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const review = await Review.findById(id);
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  if (review.user.toString() !== session.user.id && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const productId = review.product;
  await review.deleteOne();

  // Recalculate rating
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    rating: stats.length ? Math.round(stats[0].avg * 10) / 10 : 0,
    reviewCount: stats.length ? stats[0].count : 0,
  });

  return NextResponse.json({ message: "Review deleted." });
}
