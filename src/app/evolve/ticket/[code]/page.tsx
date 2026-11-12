"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { CheckCircle2, Tag, Download, CalendarPlus, Loader2, Clock, MapPin, Calendar } from "lucide-react";
import { EvolveShell } from "@/components/evolve/shell";
import { InviteFriend } from "@/components/site/invite-friend";
import { EVOLVE, type EvolveCategory } from "@/lib/evolve-config";
import { downloadCalendarFile } from "@/lib/evolve-client";

type Ticket = {
  full_name: string; email: string; category: EvolveCategory; payment_status: "free" | "pending" | "paid";
  amount_paid: number | null; payment_reference: string | null; ticket_code: string; fee: number;
};

const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

export default function TicketPage() {
  const { code } = useParams<{ code: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [qr, setQr] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/evolve/ticket?code=${encodeURIComponent(code)}`);
    if (!res.ok) return setState("missing");
    setTicket(await res.json());
    setState("ready");
  }, [code]);

  useEffect(() => { load(); }, [load]);

  const ok = ticket && ticket.payment_status !== "pending";
  useEffect(() => {
    if (ticket && ok) QRCode.toDataURL(ticket.ticket_code, { width: 360, margin: 1 }).then(setQr);
  }, [ticket, ok]);

  const downloadImage = () => {
    if (!ticket || !qr) return;
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = 800; c.height = 1100;
      const g = c.getContext("2d")!;
      const bg = g.createLinearGradient(0, 0, 800, 1100);
      bg.addColorStop(0, "#7b6cf0"); bg.addColorStop(1, "#2f45e6");
      g.fillStyle = bg; g.fillRect(0, 0, 800, 1100);
      g.fillStyle = "#ffffff"; g.textAlign = "center"; g.font = "800 90px Poppins, sans-serif"; g.fillText("Evolve", 400, 150);
      g.font = "italic 32px Georgia, serif"; g.fillText(EVOLVE.tagline, 400, 205);
      g.fillStyle = "#ffffff"; g.fillRect(140, 250, 520, 520); g.drawImage(img, 170, 280, 460, 460);
      g.fillStyle = "#ffffff"; g.font = "bold 44px Poppins, sans-serif"; g.fillText(ticket.full_name, 400, 840);
      g.fillStyle = "#dbe4ff"; g.font = "28px Poppins, sans-serif";
      g.fillText(`${EVOLVE.categoryLabels[ticket.category]} · ${ticket.payment_status === "paid" ? "PAID" : "FREE"} · ${ticket.ticket_code}`, 400, 892);
      g.font = "24px Poppins, sans-serif";
      g.fillText("Thurs 19th – Sun 22nd Nov 2026 · 8AM & 4PM daily", 400, 960);
      g.fillText("36 Abakaliki Street, beside Queens Suites", 400, 1000);
      g.fillText("Awka, Anambra State", 400, 1035);
      const a = document.createElement("a"); a.download = `evolve-ticket-${ticket.ticket_code}.png`; a.href = c.toDataURL("image/png"); a.click();
    };
    img.src = qr;
  };

  const grad = "bg-gradient-to-r from-[#7b6cf0] to-[#2f45e6] text-white shadow-lg shadow-[#4f46e5]/30";
  return (
    <EvolveShell>
      <main className="mx-auto max-w-lg px-5 pb-20 pt-4">
        {state === "loading" && <div className="grid place-items-center py-24"><Loader2 className="h-8 w-8 animate-spin text-[#5b5be8]" /></div>}

        {state === "missing" && (
          <div className="py-20 text-center">
            <h1 className="text-2xl font-bold">Ticket not found</h1>
            <p className="mt-2 text-[#5b6280]">Check the link in your email, or register again.</p>
            <Link href="/evolve" className={`mt-6 inline-block rounded-full px-7 py-3 text-sm font-semibold ${grad}`}>Go to Evolve</Link>
          </div>
        )}

        {ticket && state === "ready" && (
          <>
            <div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-indigo-300/50 ring-1 ring-indigo-100">
              <div className="bg-gradient-to-br from-[#7b6cf0] via-[#4f46e5] to-[#2f45e6] px-8 py-7 text-center text-white">
                <div className="text-5xl font-extrabold tracking-tight">Evolve</div>
                <div className="evolve-serif mt-1 text-lg text-white/90">{EVOLVE.tagline}</div>
              </div>

              {ticket.payment_status === "pending" ? (
                <div className="px-8 py-9 text-center">
                  <h1 className="text-xl font-bold">Registration not complete</h1>
                  <p className="mt-2 text-sm text-[#5b6280]">Payment for this registration wasn&apos;t confirmed, so it isn&apos;t active. Please register again and complete your payment.</p>
                  <Link href="/evolve#register" className={`mt-6 inline-block rounded-full px-7 py-3 text-sm font-semibold ${grad}`}>Register again</Link>
                </div>
              ) : (
                <div className="px-8 py-9 text-center">
                  <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1 text-xs font-bold text-green-600 ring-1 ring-green-200">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {ticket.payment_status === "paid" ? "PAID" : "FREE ENTRY"}
                  </div>
                  <div className="mx-auto mt-5 w-56 rounded-2xl bg-white p-3 shadow-lg shadow-indigo-200 ring-1 ring-indigo-100">
                    {qr ? <img src={qr} alt={`Ticket QR code ${ticket.ticket_code}`} className="w-full" /> : <div className="grid h-48 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#5b5be8]" /></div>}
                  </div>
                  <h1 className="mt-5 text-2xl font-bold">{ticket.full_name}</h1>
                  <div className="mt-1 text-sm font-semibold text-[#3b4de8]">{EVOLVE.categoryLabels[ticket.category]} · Ticket {ticket.ticket_code}</div>
                  {ticket.payment_status === "paid" && ticket.amount_paid && (
                    <div className="mt-1 text-xs text-[#7a80a3]">Paid {naira(ticket.amount_paid)} · Ref {ticket.payment_reference}</div>
                  )}
                  <div className="mt-6 space-y-2 border-t border-indigo-100 pt-5 text-sm text-[#3d4468]">
                    <div className="flex items-center justify-center gap-2"><Calendar className="h-4 w-4 text-[#4f46e5]" />{EVOLVE.dateLabel}</div>
                    <div className="flex items-center justify-center gap-2"><Clock className="h-4 w-4 text-[#4f46e5]" />{EVOLVE.sessions.join(" & ")} daily</div>
                    <div className="flex items-start justify-center gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#4f46e5]" />{EVOLVE.venue}</div>
                  </div>
                  <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#eef0ff] p-4 text-left text-sm text-[#3b4de8]">
                    <Tag className="mt-0.5 h-5 w-5 shrink-0" />
                    <p><b>Next step:</b> collect your physical tag at the venue registration desk. Bring this ticket, on your phone or printed.</p>
                  </div>
                </div>
              )}
            </div>

            {ok && (
              <>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button onClick={downloadImage} className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold ${grad}`}>
                    <Download className="h-4 w-4" /> Save ticket as image
                  </button>
                  <button onClick={downloadCalendarFile} className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-6 py-3 text-sm font-semibold text-[#3b4de8] hover:border-[#5b5be8]">
                    <CalendarPlus className="h-4 w-4" /> Add to calendar
                  </button>
                </div>
                <div className="mt-10 text-center">
                  <h2 className="font-bold">Bring someone with you</h2>
                  <p className="mb-4 mt-1 text-sm text-[#5b6280]">Invite a friend to register for Evolve.</p>
                  <InviteFriend />
                </div>
              </>
            )}
          </>
        )}
      </main>
    </EvolveShell>
  );
}
