// Sends Evolve email reminders (7 days, 1 day, 2 hours before) through Gmail.
// Run it on a schedule (see EVOLVE_SETUP.md).
// Secrets needed: GMAIL_USER, GMAIL_APP_PASSWORD, EVOLVE_STARTS_AT (ISO, e.g. 2026-11-19T08:00:00+01:00),
// EVOLVE_VENUE, SITE_URL
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const WINDOWS = [
  { key: "reminder_7d_sent_at", label: "in 7 days", ms: 7 * 86400000 },
  { key: "reminder_1d_sent_at", label: "tomorrow", ms: 86400000 },
  { key: "reminder_2h_sent_at", label: "in 2 hours", ms: 2 * 3600000 },
] as const;

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const startsAt = new Date(Deno.env.get("EVOLVE_STARTS_AT")!).getTime();
  const untilStart = startsAt - Date.now();
  if (untilStart <= 0) return new Response("Event already started", { status: 200 });

  // Pick the latest window that has already opened (so late registrants still get the next relevant reminder)
  const due = WINDOWS.filter((w) => untilStart <= w.ms).at(-1);
  if (!due) return new Response("No reminder due yet", { status: 200 });

  const { data: people, error } = await supabase
    .from("evolve_registrations").select("*").is(due.key, null).limit(200);
  if (error) return new Response(error.message, { status: 500 });
  if (!people?.length) return new Response(`Nobody waiting for the ${due.label} reminder`, { status: 200 });

  const user = Deno.env.get("GMAIL_USER")!;
  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com", port: 465, tls: true,
      auth: { username: user, password: (Deno.env.get("GMAIL_APP_PASSWORD") ?? "").replace(/\s+/g, "") },
    },
  });

  let sent = 0;
  for (const p of people) {
    const link = `${Deno.env.get("SITE_URL")}/evolve/ticket/${p.ticket_code}`;
    const pending = p.payment_status === "pending";
    try {
      await client.send({
        from: `The Crowned Church <${user}>`,
        to: p.email,
        subject: `Evolve is ${due.label}! 🚀`,
        html: `<p>Hi ${p.full_name.split(" ")[0]},</p><p>This is a friendly reminder that <b>Evolve</b> is <b>${due.label}</b>.</p>
               <p>📍 ${Deno.env.get("EVOLVE_VENUE") ?? ""}</p><p>Remember to collect your physical tag at the venue registration desk.</p>${pending ? "<p><b>Your payment is still pending.</b> Complete it to get your ticket:</p>" : "<p>Have your ticket QR code ready:</p>"}<p><a href="${link}">Open my ticket</a></p><p>— The Crowned Church</p>`,
      });
      await supabase.from("evolve_registrations").update({ [due.key]: new Date().toISOString() }).eq("id", p.id);
      sent++;
    } catch (e) {
      console.error("Gmail send failed for", p.email, e); // will be retried on the next hourly run
    }
  }
  await client.close();
  return new Response(`Sent ${sent} of ${people.length} reminders (${due.label})`, { status: 200 });
});
