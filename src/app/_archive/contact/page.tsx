"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  MapPin, Phone, Mail, Clock, ArrowRight, Send, MessageCircle,
} from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { Reveal } from "@/components/site/reveal";
import { CHURCH_CONTACT, SERVICE_TIMES } from "@/lib/site-data";

const REASONS = [
  "General Inquiry",
  "Prayer Request",
  "Join a Fellowship",
  "Partnership & Giving",
  "Beautiful Today Devotional",
  "Something Else",
];

const CONTACT_CARDS = [
  {
    icon: MapPin,
    title: "Visit Us",
    lines: [CHURCH_CONTACT.address],
  },
  {
    icon: Phone,
    title: "Call Us",
    lines: [CHURCH_CONTACT.phone],
    href: CHURCH_CONTACT.phoneHref,
  },
  {
    icon: Mail,
    title: "Email Us",
    lines: [CHURCH_CONTACT.email],
    href: `mailto:${CHURCH_CONTACT.email}`,
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    lines: ["Chat with our team"],
    href: CHURCH_CONTACT.whatsappUrl,
    external: true,
  },
];

type FormState = {
  name: string;
  email: string;
  phone: string;
  reason: string;
  message: string;
};

const EMPTY_FORM: FormState = { name: "", email: "", phone: "", reason: REASONS[0], message: "" };

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const update = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);

    const subject = encodeURIComponent(`[${form.reason}] Message from ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone || "—"}\nReason: ${form.reason}\n\n${form.message}`
    );

    window.location.href = `mailto:${CHURCH_CONTACT.email}?subject=${subject}&body=${body}`;

    toast.success("Opening your email app to send your message…");
    setForm(EMPTY_FORM);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#140929]">
        <div className="absolute inset-0">
          <img
            src="/images/moments/congregation-worship.jpg"
            alt="Members worshipping together at TCC Global"
            className="h-full w-full object-cover opacity-[0.35]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#140929] via-[#140929]/95 to-[#140929]/60" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#140929] via-transparent to-[#140929]/70" />
        </div>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl"
          animate={{ y: [0, -24, 0], x: [0, 12, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center md:py-28">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300 backdrop-blur">
              <MessageCircle className="h-3.5 w-3.5" /> Get in touch
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] text-white md:text-5xl lg:text-6xl">
              We&apos;d love to{" "}
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                hear from you
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-white/70">
              Whether it&apos;s a question, a prayer request, or you just want to say hello —
              our team is ready to connect with you.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Contact cards */}
      <section className="mx-auto -mt-10 max-w-6xl px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {CONTACT_CARDS.map((c) => {
            const CardInner = (
              <>
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">{c.title}</h3>
                {c.lines.map((line) => (
                  <p key={line} className="mt-1 text-sm text-muted-foreground">{line}</p>
                ))}
              </>
            );
            return (
              <motion.div
                key={c.title}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="rounded-2xl border border-border bg-white p-6 shadow-lg shadow-primary/5"
              >
                {c.href ? (
                  <a
                    href={c.href}
                    target={c.external ? "_blank" : undefined}
                    rel={c.external ? "noopener noreferrer" : undefined}
                    className="block"
                  >
                    {CardInner}
                  </a>
                ) : (
                  CardInner
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Form + Map */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-10 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <div className="rounded-[2rem] border border-border bg-white p-6 shadow-sm md:p-10">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Send a message</span>
              <h2 className="mt-3 text-2xl font-bold md:text-3xl">Tell us what&apos;s on your heart</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Fill in the form below and we&apos;ll get back to you as soon as we can.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-1">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Full Name</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={update("name")}
                    required
                    placeholder="Your name"
                    className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="block sm:col-span-1">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Email Address</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="block sm:col-span-1">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Phone Number (optional)</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={update("phone")}
                    placeholder="080X XXX XXXX"
                    className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <label className="block sm:col-span-1">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Reason for Contact</span>
                  <select
                    value={form.reason}
                    onChange={update("reason")}
                    className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Message</span>
                  <textarea
                    value={form.message}
                    onChange={update("message")}
                    required
                    rows={5}
                    placeholder="How can we help?"
                    className="w-full resize-none rounded-xl border border-border bg-background/60 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <div className="sm:col-span-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 sm:w-auto"
                  >
                    <Send className="h-4 w-4" /> {submitting ? "Sending…" : "Send Message"}
                  </motion.button>
                </div>
              </form>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-2">
            <div className="flex h-full flex-col gap-5">
              <div className="overflow-hidden rounded-[2rem] border border-border shadow-sm">
                <iframe
                  title="TCC Global location map"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(CHURCH_CONTACT.address)}&output=embed`}
                  className="h-64 w-full grayscale-[15%]"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="rounded-[2rem] border border-border bg-secondary/40 p-6">
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Service Times</span>
                </div>
                <ul className="mt-4 space-y-2.5">
                  {SERVICE_TIMES.map((s) => (
                    <li key={s.name} className="flex items-center justify-between gap-3 border-b border-border/60 pb-2.5 text-sm last:border-0 last:pb-0">
                      <span className="text-muted-foreground">{s.day} · {s.name}</span>
                      <span className="font-medium text-foreground">{s.time}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <a
                href={CHURCH_CONTACT.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between rounded-[2rem] bg-gradient-to-br from-primary to-accent p-6 text-white shadow-lg shadow-primary/20"
              >
                <div>
                  <div className="text-sm font-semibold">Prefer to chat now?</div>
                  <div className="mt-1 text-xs text-white/80">Message us directly on WhatsApp</div>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
