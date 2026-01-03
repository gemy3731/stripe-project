import { NextResponse } from "next/server";
import Stripe from "stripe";
import handlePaymentIntent from "./handlePaymentIntent";



const secretKey = process.env.STRIPE_SECRET_KEY;



const stripe = new Stripe(secretKey!, {
  apiVersion: "2025-12-15.clover",
});

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return new NextResponse("No signature found", { status: 400 });
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    //eslint-disable-next-line
  } catch (err: any) {
    return new NextResponse(`Webhook error: ${err.message}`, { status: 400 });
  }
  console.log("Webhook event received:", event.type);
  switch (event.type) {

    case "payment_intent.succeeded": {
      await handlePaymentIntent(event);
      break;
    }

  }
  return new NextResponse(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
