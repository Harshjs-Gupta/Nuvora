import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/lib/models/Order";
import { sendOrderEmail } from "@/lib/sendOrderEmail";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

// GET /api/orders — user's own orders (or all for admin)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 10;

    await connectDB();
    const filter = session.user.role === "admin" ? {} : { user: session.user.id };
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);
    console.log(orders, total, page);
    return NextResponse.json({ orders, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error("GET /api/orders failed:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// POST /api/orders — create after Razorpay payment verification
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await req.json().catch(() => null);
    const {
      items,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      shippingAddress,
    } = body ?? {};

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in order." }, { status: 400 });
    }
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
    }

    // Verify Razorpay signature
    const crypto = await import("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    // Normalize items so only known fields are stored
    const cleanItems = items.map((i: Record<string, unknown>) => ({
      asin: String(i.asin ?? ""),
      title: String(i.title ?? ""),
      image: String(i.image ?? ""),
      price: num(i.price),
      originalPrice: num(i.originalPrice),
      starRating: num(i.starRating),
      url: String(i.url ?? ""),
      currency: String(i.currency ?? "INR"),
      quantity: Math.max(1, Math.floor(num(i.quantity, 1))),
    }));

    if (cleanItems.some((i) => !i.asin || !i.title)) {
      return NextResponse.json({ error: "Invalid item data." }, { status: 400 });
    }

    // Recompute totals on the server instead of trusting the client
    const subtotal = cleanItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    await connectDB();
    const order = await Order.create({
      user: session.user.id,
      items: cleanItems,
      subtotal,
      total: subtotal,
      status: "confirmed",
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      shippingAddress,
    });

    // Confirmation email. Never fail the order if the email fails.
    const userEmail = session.user?.email;
    if (userEmail) {
      try {
        await sendOrderEmail({
          to: userEmail,
          customerName: session.user?.name ?? undefined,
          orderId: String(order._id),
          paymentId: razorpayPaymentId,
          items: cleanItems,
          total: subtotal,
        });
      } catch (emailErr) {
        console.error("Order saved, but confirmation email failed:", emailErr);
      }
    } else {
      console.warn("Order saved, but the session has no email. Skipping confirmation email.");
    }

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    console.error("POST /api/orders failed:", err);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development" && err instanceof Error
            ? err.message
            : "Internal server error.",
      },
      { status: 500 }
    );
  }
}