import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import Product from "@/lib/models/Product";
import User from "@/lib/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  await connectDB();

  const [
    totalProducts,
    totalUsers,
    orderStats,
    lowStockProducts,
    recentOrders,
    monthlySales,
  ] = await Promise.all([
    Product.countDocuments({ isActive: true }),
    User.countDocuments({ role: "customer" }),
    Order.aggregate([
      { $match: { status: { $in: ["confirmed", "shipped", "delivered"] } } },
      { $group: { _id: null, totalRevenue: { $sum: "$total" }, totalOrders: { $sum: 1 } } },
    ]),
    Product.countDocuments({ stock: { $lte: 10 }, isActive: true }),
    Order.find().sort({ createdAt: -1 }).limit(5).lean(),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) },
          status: { $in: ["confirmed", "shipped", "delivered"] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          revenue: { $sum: "$total" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return NextResponse.json({
    totalProducts,
    totalUsers,
    totalRevenue: orderStats[0]?.totalRevenue ?? 0,
    totalOrders: orderStats[0]?.totalOrders ?? 0,
    lowStockProducts,
    recentOrders,
    monthlySales,
  });
}
