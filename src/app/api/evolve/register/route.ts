import { NextResponse } from "next/server";
import { EVOLVE, type EvolveCategory } from "@/lib/evolve-config";
import { adminClient, newTicketCode, sendEmail, ticketEmail } from "@/lib/evolve-server";

const CATEGORIES: EvolveCategory[] = ["member", "worker", "state_pastor", "campus_pastor"];

export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  if (Date.now() > new Date(EVOLVE.registrationClosesAt).getTime())
    return NextResponse.json({ error: "Registration has closed." }, { status: 403 });

  const full_name = String(b.full_name ?? "").trim();
  const email = String(b.email ?? "").trim().toLowerCase();
  const phone = String(b.phone ?? "").trim() || null;
  const category = b.category as EvolveCategory;

  if (full_name.length < 2 || full_name.length > 120) return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  if (!CATEGORIES.includes(category)) return NextResponse.json({ error: "Please choose how you're registering." }, { status: 400 });

  const db = adminClient();

  // Already registered? Re-send the ticket link to that inbox (never reveal it on screen).
  const { data: existing } = await db.from("evolve_registrations").select("id, full_name, ticket_code, payment_status").eq("email", email).maybeSingle();
  if (existing && existing.payment_status !== "pending") {
    await sendEmail(email, "Your Evolve ticket", ticketEmail(existing.full_name, existing.ticket_code, existing.payment_status));
    return NextResponse.json({ duplicate: true });
  }
  if (existing) await db.from("evolve_registrations").delete().eq("id", existing.id); // old unpaid attempt: not a registration

  const fee = EVOLVE.fees[category];

  // Paid categories: NOTHING is saved yet. They are registered only after the payment is confirmed.
  if (fee > 0) {
    const reference = `EVO-${newTicketCode()}${Date.now().toString(36).toUpperCase()}`;
    return NextResponse.json({ requires_payment: true, fee, reference });
  }

  return NextResponse.json({ error: `Registration for this category isn't open yet. Please call ${EVOLVE.phone}.` }, { status: 400 });
}
