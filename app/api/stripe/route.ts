import { NextResponse } from "next/server";
import Stripe from "stripe";
const secretKey = process.env.STRIPE_SECRET_KEY;

const stripe = new Stripe(secretKey!, {
  apiVersion: "2025-12-15.clover",
});

interface Product {
  name: string;
  description: string;
  price: number;
  quantity: number;
}

const allowedOrigin = process.env.NEXT_PUBLIC_ENV=== "production"?"https://ur-store-three.vercel.app":"http://localhost:5173";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: Request) {
  const { host, products, cartId } = await req.json();
  const selectedProducts: Product[] = products;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      payment_intent_data: {
        metadata: {
          cartId,
        },
      },
      line_items: selectedProducts.map((product) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.price * 100,
        },
        quantity: product.quantity,
      })),
      metadata: {
        cartId,
      },
      success_url: `${host}`,
      cancel_url: `${host}`,
    });
    console.log("Created Stripe session:", session);
    return NextResponse.json({ url: session.url },{
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "User not found" }, { status: 404,headers: {"Access-Control-Allow-Origin": allowedOrigin,}});
  }
}
