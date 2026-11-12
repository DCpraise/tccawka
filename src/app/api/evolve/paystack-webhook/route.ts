import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { registerFromPayment } from "@/lib/evolve-server";

// NOTE: Paystack signs webhooks with your SECRET key (sk_...), so PAYSTACK_SECRET_KEY must be set for this route.
// Safety net: if someone pays but closes the tab, Paystack still tells us. Set this URL in your Paystack dashboard.
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-paystack-signature");
  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY ?? "").update(raw).digest("hex");
  if (!sig || sig !== expected) return NextResponse.json({ error: "Bad signature" }, { status: 401 });

  const event = JSON.parse(raw);
  // Safety net: if someone pays but closes the tab, we still register them. Only handles Evolve payments.
  if (event?.event === "charge.success" && event.data?.metadata?.category && event.data?.reference) {
    await registerFromPayment(String(event.data.reference));
  }
  return NextResponse.json({ received: true });
}
