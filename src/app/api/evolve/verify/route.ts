import { NextResponse } from "next/server";
import { registerFromPayment } from "@/lib/evolve-server";

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const reference = String(b?.reference ?? "");
  if (!reference) return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });
  const r = await registerFromPayment(reference);
  return r.ok ? NextResponse.json({ ok: true, ticket_code: r.ticket_code }) : NextResponse.json({ error: r.error }, { status: r.status });
}
