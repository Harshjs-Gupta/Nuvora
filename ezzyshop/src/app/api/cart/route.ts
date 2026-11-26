import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Cart from "@/lib/models/Cart";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function parseNumber(value: unknown): number {
  const n = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

function errorResponse(err: unknown, label: string) {
  console.error(label, err);
  const isDbDown = err instanceof Error && err.name === "MongooseServerSelectionError";
  return NextResponse.json(
    {
      error: isDbDown
        ? "Database unavailable. Please try again in a moment."
        : process.env.NODE_ENV === "development" && err instanceof Error
          ? err.message
          : "Internal server error.",
    },
    { status: isDbDown ? 503 : 500 }
  );
}

// GET /api/cart — get user's cart
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    await connectDB();
    const cart = await Cart.findOne({ user: session.user.id }).lean();
    return NextResponse.json(cart ?? { items: [] });
  } catch (err) {
    return errorResponse(err, "GET /api/cart failed:");
  }
}

// POST /api/cart — add or update item
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const userId = session.user?.id;
  if (!userId) {
    console.error("POST /api/cart: session.user.id is missing", session.user);
    return NextResponse.json({ error: "Session is missing user id." }, { status: 500 });
  }

  try {
    const body = await req.json().catch(() => null);

    const asin = body?.productId;
    const title = body?.title;
    const image = typeof body?.image === "string" ? body.image : "";
    const url = typeof body?.url === "string" ? body.url : "";
    const currency =
      typeof body?.currency === "string" && body.currency ? body.currency : "INR";
    const price = parseNumber(body?.price);
    const originalPrice = Number.isNaN(parseNumber(body?.originalPrice))
      ? 0
      : parseNumber(body?.originalPrice);
    const starRating = Math.min(
      5,
      Math.max(0, Number.isNaN(parseNumber(body?.starRating)) ? 0 : parseNumber(body?.starRating))
    );
    const quantity = Number(body?.quantity ?? 1);

    if (!asin || typeof asin !== "string") {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }
    if (!title || typeof title !== "string") {
      return NextResponse.json({ error: "title is required." }, { status: 400 });
    }
    if (Number.isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Invalid price." }, { status: 400 });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: "Invalid quantity." }, { status: 400 });
    }

    await connectDB();

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    const existingIdx = cart.items.findIndex((i: { asin: string }) => i.asin === asin);

    if (existingIdx >= 0) {
      const item = cart.items[existingIdx];
      item.quantity = quantity;
      // refresh details in case price/photo changed since it was first added
      item.title = title;
      item.image = image;
      item.price = price;
      item.originalPrice = originalPrice;
      item.starRating = starRating;
      item.url = url;
      item.currency = currency;
    } else {
      cart.items.push({
        asin,
        title,
        image,
        price,
        originalPrice,
        starRating,
        url,
        currency,
        quantity,
      });
    }

    await cart.save();
    return NextResponse.json(cart);
  } catch (err) {
    return errorResponse(err, "POST /api/cart failed:");
  }
}

// DELETE /api/cart — remove item (send { productId: asin })
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const { productId } = await req.json();
    await connectDB();
    const cart = await Cart.findOne({ user: session.user.id });
    if (!cart) return NextResponse.json({ error: "Cart not found." }, { status: 404 });

    cart.items = cart.items.filter((i: { asin: string }) => i.asin !== productId);
    await cart.save();
    return NextResponse.json(cart);
  } catch (err) {
    return errorResponse(err, "DELETE /api/cart failed:");
  }
}