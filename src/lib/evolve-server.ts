import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import { EVOLVE, type EvolveCategory } from "@/lib/evolve-config";

export function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

export const newTicketCode = () => randomBytes(5).toString("hex").toUpperCase();
export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
export const ticketUrl = (code: string) => `${siteUrl()}/evolve/ticket/${code}`;

// Sends email through a Gmail account (GMAIL_USER + GMAIL_APP_PASSWORD).
// It NEVER throws and users NEVER see an email error: a failure is only written to the Vercel logs, and registration carries on normally.
export async function sendEmail(to: string, subject: string, html: string) {
  const user = process.env.GMAIL_USER;
  const pass = (process.env.GMAIL_APP_PASSWORD ?? "").replace(/\s+/g, "");
  if (!user || !pass) {
    console.error("Email skipped: GMAIL_USER or GMAIL_APP_PASSWORD is not set");
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass },
      connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 12000 }); // never hang the registration
    await transporter.sendMail({ from: `The Crowned Church <${user}>`, to, subject, html });
    return true;
  } catch (e) {
    console.error("Gmail send failed:", e);
    return false;
  }
}

export function ticketEmail(name: string, code: string, status: "free" | "pending" | "paid") {
  const first = name.split(" ")[0];
  const body =
    status === "pending"
      ? `<p>Your Evolve registration is saved. <b>Complete your payment</b> to receive your ticket:</p>`
      : `<p>You're registered for <b>Evolve</b>! Your ticket (with QR code) is ready. Show it at the door each day:</p>`;
  return `<p>Hi ${first},</p>${body}<p><a href="${ticketUrl(code)}">Open my ticket</a></p>
    <p><b>Next step:</b> after paying online, collect your physical tag at the venue registration desk. Bring this ticket (on your phone or printed).</p>
    <p>📅 ${EVOLVE.dateLabel} · ${EVOLVE.sessions.join(" & ")} daily<br/>📍 ${EVOLVE.venue}</p><p>— The Crowned Church</p>`;
}

// Creates the registration ONLY after Paystack confirms the payment. Safe to call twice (callback + webhook).
export async function registerFromPayment(reference: string) {
  const db = adminClient();

  const { data: done } = await db.from("evolve_registrations").select("ticket_code").eq("payment_reference", reference).maybeSingle();
  if (done) return { ok: true as const, ticket_code: done.ticket_code as string };

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    // Restricted key (transactions:read) is enough to verify. Falls back to the secret key if not set.
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_RESTRICTED_KEY || process.env.PAYSTACK_SECRET_KEY}` },
  });
  const json = await res.json().catch(() => null);
  const d = json?.data;
  if (!res.ok || d?.status !== "success" || d?.currency !== "NGN" || d?.reference !== reference)
    return { ok: false as const, status: 402, error: "We couldn't confirm your payment yet." };

  const m = d.metadata ?? {};
  const category = m.category as EvolveCategory;
  const fee = EVOLVE.fees[category];
  if (!fee || d.amount < fee * 100)
    return { ok: false as const, status: 400, error: "The amount paid doesn't match the registration." };

  const email = String(d.customer?.email ?? "").trim().toLowerCase();
  const full_name = String(m.full_name ?? "").trim().slice(0, 120);
  if (!email || full_name.length < 2) return { ok: false as const, status: 400, error: "Missing registration details." };

  const row = {
    full_name, email, category,
    phone: String(m.phone ?? "").trim() || null,
    heard_from: String(m.heard_from ?? "").slice(0, 60) || null,
    is_member: false,
    payment_status: "paid",
    amount_paid: Math.round(d.amount / 100),
    payment_reference: reference,
    paid_at: new Date().toISOString(),
  };

  const ticket_code = newTicketCode();
  const { error } = await db.from("evolve_registrations").insert({ ...row, ticket_code });

  if (error?.code === "23505") {
    if (error.message.includes("payref")) {
      const { data } = await db.from("evolve_registrations").select("ticket_code").eq("payment_reference", reference).maybeSingle();
      if (data) return { ok: true as const, ticket_code: data.ticket_code as string };
    }
    // Same email already registered
    const { data: prev } = await db.from("evolve_registrations").select("id, ticket_code, payment_status").eq("email", email).maybeSingle();
    if (prev?.payment_status === "pending") {
      await db.from("evolve_registrations").update(row).eq("id", prev.id);
      return { ok: true as const, ticket_code: prev.ticket_code as string };
    }
    return { ok: false as const, status: 409, error: `This email is already registered. If you were charged again, please call ${EVOLVE.phone} for a refund.` };
  }
  if (error) return { ok: false as const, status: 500, error: `We received your payment but couldn't save the registration. Please call ${EVOLVE.phone}.` };

  await sendEmail(email, "Your Evolve ticket 🎟️", ticketEmail(full_name, ticket_code, "paid"));
  return { ok: true as const, ticket_code };
}
