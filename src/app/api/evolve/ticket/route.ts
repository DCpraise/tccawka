import { NextResponse } from "next/server";
import { EVOLVE, type EvolveCategory } from "@/lib/evolve-config";
import { adminClient } from "@/lib/evolve-server";

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code")?.toUpperCase() ?? "";
  if (!/^[0-9A-F]{10}$/.test(code)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { data } = await adminClient().from("evolve_registrations")
    .select("full_name, email, category, payment_status, amount_paid, payment_reference, ticket_code")
    .eq("ticket_code", code).maybeSingle();
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...data, fee: EVOLVE.fees[data.category as EvolveCategory] });
}
