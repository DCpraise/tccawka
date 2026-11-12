"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Calendar, Clock, MapPin, Phone, Send, Navigation, Lock, QrCode, Bell, Tag, CreditCard, Download, ArrowDown,
} from "lucide-react";
import { Reveal } from "@/components/site/reveal";
import { InviteFriend } from "@/components/site/invite-friend";
import { EvolveShell } from "@/components/evolve/shell";
import { Butterfly } from "@/components/evolve/butterfly";
import { GlassRibbons } from "@/components/evolve/glass-ribbons";
import { EVOLVE, type EvolveCategory } from "@/lib/evolve-config";

const HEARD_FROM = ["Church member", "Friend or family", "Instagram", "Facebook", "YouTube", "WhatsApp", "Other"];
const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;
type PaystackWindow = Window & {
  PaystackPop?: { setup: (o: Record<string, unknown>) => { openIframe: () => void } };
};

const btn = "bg-gradient-to-r from-[#7b6cf0] to-[#2f45e6] text-white shadow-lg shadow-[#4f46e5]/30";

function useCountdown(target: string) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (now === null) return null;
  const diff = Math.max(0, new Date(target).getTime() - now);
  return {
    days: Math.floor(diff / 86400000), hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60), seconds: Math.floor((diff / 1000) % 60), over: diff === 0, now,
  };
}

export default function EvolvePage() {
  const router = useRouter();
  const countdown = useCountdown(EVOLVE.startsAt);
  const closed = countdown ? countdown.now > new Date(EVOLVE.registrationClosesAt).getTime() : false;
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [retryRef, setRetryRef] = useState<string | null>(null);
  const paymentDone = useRef(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", heard_from: "",
    category: "" as "" | EvolveCategory,
  });

  const input = "w-full rounded-xl border border-indigo-100 bg-white px-4 py-3 text-sm text-[#1e1b4b] outline-none transition focus:border-[#5b5be8] focus:ring-4 focus:ring-[#5b5be8]/15";
  const fee = form.category ? EVOLVE.fees[form.category] : 0;

  useEffect(() => {
    if (document.getElementById("paystack-js")) return;
    const sc = document.createElement("script");
    sc.id = "paystack-js"; sc.src = "https://js.paystack.co/v1/inline.js"; sc.async = true;
    document.body.appendChild(sc);
  }, []);

  // Registration is created on the server only after Paystack confirms the payment.
  const finalize = async (reference: string) => {
    setPaying(true);
    try {
      const res = await fetch("/api/evolve/verify", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reference }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setRetryRef(reference);
        return toast.error(json.error ?? "We couldn't confirm your payment yet.");
      }
      setRetryRef(null);
      toast.success("Payment confirmed. You're registered!");
      router.push(`/evolve/ticket/${json.ticket_code}`);
    } catch {
      setRetryRef(reference);
      toast.error("Network problem. Tap “Check again”.");
    } finally {
      setPaying(false);
    }
  };

  const startPayment = (reference: string, amount: number) => {
    const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
    const w = window as PaystackWindow;
    if (!key) return toast.error(`Online payment isn't switched on yet. Please call ${EVOLVE.phone}.`);
    if (!w.PaystackPop) return toast.error("Payment is still loading. Please try again in a moment.");
    paymentDone.current = false;
    setPaying(true);
    w.PaystackPop.setup({
      key, email: form.email.trim().toLowerCase(), amount: amount * 100, currency: "NGN", ref: reference,
      metadata: {
        category: form.category, full_name: form.full_name.trim(), phone: form.phone.trim(),
        heard_from: form.heard_from,
        custom_fields: [
          { display_name: "Name", variable_name: "name", value: form.full_name.trim() },
          { display_name: "Category", variable_name: "category", value: form.category ? EVOLVE.categoryLabels[form.category] : "" },
        ],
      },
      callback: (r: { reference: string }) => { paymentDone.current = true; finalize(r.reference); },
      onClose: () => {
        if (!paymentDone.current) { setPaying(false); toast.info("Payment not completed, so you have not been registered yet."); }
      },
    }).openIframe();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) return toast.error("Please choose how you're registering.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/evolve/register", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) return toast.error(json.error ?? "Something went wrong. Please try again.");
      if (json.duplicate) return toast.info("This email is already registered. We've re-sent the ticket link to that inbox.");
      if (json.requires_payment) return startPayment(json.reference, json.fee);
    } catch {
      toast.error("Network problem. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const info = [
    { icon: Calendar, text: "Thurs. 19th – Sun. 22nd Nov 2026 // 8AM & 4PM Daily" },
    { icon: MapPin, text: EVOLVE.venue },
    { icon: Phone, text: EVOLVE.phone, href: EVOLVE.phoneHref },
  ];

  return (
    <EvolveShell>
      {/* ───────── Hero ───────── */}
      <section className="relative mx-auto max-w-6xl px-5 pb-16 pt-4 lg:pb-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Reveal>
              <h1 className="font-extrabold leading-[0.9] tracking-tight">
                <span className="evolve-grad-text block text-[5.2rem] sm:text-[8rem] lg:text-[9.5rem]">
                  Ev
                  <span className="relative inline-block">
                    o
                    <Butterfly className="absolute -top-[0.28em] left-[0.02em] h-[0.5em] w-[0.5em]" />
                  </span>
                  lve
                </span>
              </h1>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="evolve-serif mt-3 text-2xl font-medium text-[#1e1b4b] sm:text-3xl">{EVOLVE.tagline}</p>
              <p className="mt-4 text-xl text-[#3b4de8] sm:text-2xl">
                Live <span className="font-bold">with {EVOLVE.speaker}</span>
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <ul className="mt-8 space-y-3.5">
                {info.map(({ icon: Icon, text, href }) => (
                  <li key={text} className="flex items-start gap-3.5 text-[0.95rem] font-medium text-[#1e1b4b]">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#4f46e5] shadow-sm shadow-indigo-200 ring-1 ring-indigo-100">
                      <Icon className="h-5 w-5" />
                    </span>
                    {href ? <a href={href} className="pt-2">{text}</a> : <span className="pt-2">{text}</span>}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                {!closed && (
                  <a href="#register" className={`inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold transition-transform hover:scale-105 ${btn}`}>
                    Register now <ArrowDown className="h-4 w-4" />
                  </a>
                )}
                {countdown && !countdown.over && (
                  <div className="flex gap-2">
                    {([["Days", countdown.days], ["Hrs", countdown.hours], ["Min", countdown.minutes], ["Sec", countdown.seconds]] as const).map(([l, v]) => (
                      <div key={l} className="w-[3.7rem] rounded-2xl bg-white/80 py-2 text-center shadow-sm ring-1 ring-indigo-100 backdrop-blur">
                        <div className="text-lg font-bold tabular-nums text-[#2f45e6]">{String(v).padStart(2, "0")}</div>
                        <div className="text-[9px] font-semibold uppercase tracking-wider text-[#7a80a3]">{l}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.12}>
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <GlassRibbons className="pointer-events-none absolute -right-16 -top-16 h-[120%] w-[120%] max-w-none" />
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative rounded-[2rem] bg-gradient-to-br from-white via-[#c9d6ff] to-[#d9c4ff] p-[3px] shadow-2xl shadow-indigo-300/50">
                <img src="/images/evolve-pastor.jpg" alt="Pastor Isaac, the speaker at Evolve" className="aspect-[1/1] w-full rounded-[1.85rem] object-cover object-top" />
                <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/80 px-5 py-3 backdrop-blur-md ring-1 ring-white">
                  <p className="text-xs font-medium text-[#7a80a3]">Live with</p>
                  <p className="text-lg font-bold text-[#2f45e6]">{EVOLVE.speaker}</p>
                </div>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────── Registration (immediately after the hero) ───────── */}
      <section id="register" className="mx-auto max-w-6xl scroll-mt-4 px-5 pb-20">
        <Reveal>
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-indigo-200/60 ring-1 ring-indigo-100 lg:grid lg:grid-cols-5">
            {/* Left panel */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#7b6cf0] via-[#4f46e5] to-[#2f45e6] p-8 text-white md:p-10 lg:col-span-2">
              <GlassRibbons className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 opacity-40" />
              <div className="relative">
                <span className="inline-flex rounded-full bg-white/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur">Pre-registration</span>
                <h2 className="mt-4 text-3xl font-bold leading-tight">Reserve your spot</h2>
                <p className="mt-2 text-sm text-white/80">Register once and attend all four days.</p>
                <ul className="mt-7 space-y-4 text-sm">
                  {[
                    { icon: CreditCard, t: "Pay securely online. One payment covers all four days." },
                    { icon: QrCode, t: "You are only registered once your payment is confirmed. Your digital ticket appears right away." },
                    { icon: Tag, t: "After you register online, you collect your physical tag at the venue." },
                    { icon: Bell, t: "Reminders a week before, the day before, and two hours before." },
                  ].map(({ icon: Icon, t }) => (
                    <li key={t} className="flex items-start gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15"><Icon className="h-5 w-5" /></span>
                      <span className="pt-1.5">{t}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7 space-y-1.5 rounded-2xl bg-white/12 p-4 text-sm backdrop-blur">
                  {(Object.keys(EVOLVE.categoryLabels) as EvolveCategory[]).map((c) => (
                    <div key={c} className="flex items-center justify-between gap-3">
                      <span>{EVOLVE.categoryLabels[c]}</span><b>{naira(EVOLVE.fees[c])}</b>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 md:p-10 lg:col-span-3">
              {closed ? (
                <div className="grid h-full place-items-center rounded-2xl border border-indigo-100 p-10 text-center">
                  <div>
                    <Lock className="mx-auto h-8 w-8 text-[#7a80a3]" />
                    <p className="mt-3 font-semibold">Registration has closed.</p>
                    <p className="mt-1 text-sm text-[#5b6280]">Please call {EVOLVE.phone} if you need help.</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#7a80a3]">I&apos;m registering as</span>
                    <div className="grid grid-cols-2 gap-3">
                      {(Object.keys(EVOLVE.categoryLabels) as EvolveCategory[]).map((c) => (
                        <button key={c} type="button" onClick={() => setForm({ ...form, category: c })}
                          className={`rounded-2xl border-2 px-3 py-3.5 text-sm font-semibold transition-all ${form.category === c ? "border-[#5b5be8] bg-[#eef0ff] text-[#2f45e6] shadow-md shadow-indigo-200" : "border-indigo-100 bg-white hover:border-[#a5b4fc]"}`}>
                          {EVOLVE.categoryLabels[c]}
                          <div className="mt-0.5 text-[11px] font-medium text-[#7a80a3]">
                            {naira(EVOLVE.fees[c])}
                          </div>
                        </button>
                      ))}
                    </div>
                    {form.category && (
                      <p className="mt-2 text-xs text-[#5b6280]">
                        {`${naira(fee)} covers all four days. You'll pay securely next, and you're registered once payment is confirmed.`}
                      </p>
                    )}
                  </div>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[#5b6280]">Full Name</span>
                    <input className={input} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Your name" required />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[#5b6280]">Email Address</span>
                    <input type="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[#5b6280]">Phone Number</span>
                    <input type="tel" className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="080X XXX XXXX" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-semibold text-[#5b6280]">How did you hear about Evolve?</span>
                    <select className={input} value={form.heard_from} onChange={(e) => setForm({ ...form, heard_from: e.target.value })}>
                      <option value="">Select…</option>
                      {HEARD_FROM.map((h) => <option key={h}>{h}</option>)}
                    </select>
                  </label>
                  {retryRef && (
                    <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200 sm:col-span-2">
                      We haven&apos;t been able to confirm your payment yet. If you were charged, <b>please don&apos;t pay again</b>.
                      <button type="button" onClick={() => finalize(retryRef)} className="ml-2 font-semibold underline">Check again</button>
                      <span className="mt-1 block text-xs">Still stuck? Call {EVOLVE.phone}.</span>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={submitting || paying}
                      className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-semibold disabled:opacity-50 ${btn}`}>
                      <Send className="h-4 w-4" /> {submitting || paying ? "Please wait…" : "Continue to payment"}
                    </motion.button>
                    <p className="mt-3 flex items-start gap-2 text-xs text-[#5b6280]">
                      <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4f46e5]" />
                      After you register online, you&apos;ll collect your physical tag at the venue.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────── Schedule ───────── */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <Reveal className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-[#5b5be8]">Schedule</span>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Four days. <span className="evolve-grad-text">Two sessions daily.</span></h2>
        </Reveal>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EVOLVE.days.map((d) => (
            <motion.div key={d.date} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} whileHover={{ y: -6 }}
              className="rounded-3xl bg-white/80 p-6 text-center shadow-lg shadow-indigo-100 ring-1 ring-indigo-100 backdrop-blur">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#a98af2] to-[#2f45e6] text-white"><Calendar className="h-5 w-5" /></div>
              <h3 className="mt-4 font-bold">{d.label}</h3>
              <div className="mt-3 space-y-1.5">
                {EVOLVE.sessions.map((s) => (
                  <div key={s} className="flex items-center justify-center gap-1.5 text-sm font-medium text-[#3b4de8]"><Clock className="h-3.5 w-3.5" /> {s}</div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ───────── Invite ───────── */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#7b6cf0] via-[#4f46e5] to-[#2f45e6] p-8 text-white shadow-2xl shadow-indigo-300/50 md:p-12">
            <GlassRibbons className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 opacity-40" />
            <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold md:text-3xl">Know someone who needs this?</h2>
                <p className="mx-auto mt-2 mb-6 max-w-md text-white/80 md:mx-0">Invite a friend, a colleague, or your family to Evolve.</p>
                <InviteFriend dark />
                <a href="/images/evolve-flyer.jpg" download="evolve-flyer.jpg"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white/90 underline-offset-4 hover:underline">
                  <Download className="h-4 w-4" /> Download the flyer to share
                </a>
              </div>
              <img src="/images/evolve-flyer.jpg" alt="Evolve flyer" className="mx-auto hidden w-72 rounded-2xl shadow-xl ring-4 ring-white/20 md:block" />
            </div>
          </div>
        </Reveal>
      </section>

      {/* ───────── Travel & directions ───────── */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <Reveal>
            <span className="text-sm font-semibold uppercase tracking-wider text-[#5b5be8]">Getting there</span>
            <h2 className="mt-2 text-3xl font-bold">Travel &amp; directions</h2>
            <div className="mt-6 space-y-4 text-sm font-medium">
              <div className="flex items-start gap-3"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#4f46e5]" /><span>{EVOLVE.venue}</span></div>
              <div className="flex items-start gap-3"><Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#4f46e5]" />
                <span>Can&apos;t find us? Call <a href={EVOLVE.phoneHref} className="font-bold text-[#2f45e6]">{EVOLVE.phone}</a></span></div>
            </div>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(EVOLVE.venue)}`} target="_blank" rel="noopener noreferrer"
              className={`mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold ${btn}`}>
              <Navigation className="h-4 w-4" /> Open in Google Maps
            </a>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="overflow-hidden rounded-[2rem] shadow-xl shadow-indigo-200/60 ring-1 ring-indigo-100">
              <iframe title="Evolve venue map" src={`https://maps.google.com/maps?q=${encodeURIComponent(EVOLVE.venue)}&output=embed`}
                className="h-72 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          </Reveal>
        </div>
      </section>
    </EvolveShell>
  );
}
