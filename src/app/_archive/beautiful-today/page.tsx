"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  BookOpen, Quote, ArrowRight, Sparkles, Send, Feather, Sunrise,
} from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { Reveal } from "@/components/site/reveal";
import { BEAUTIFUL_TODAY } from "@/lib/site-data";

const PILLARS = [
  { icon: Sunrise, title: "Daily Scripture", desc: "A focal passage each day to anchor your thoughts in God's Word." },
  { icon: Feather, title: "Honest Reflection", desc: "Short, practical writing that meets you exactly where you are." },
  { icon: Sparkles, title: "Guided Prayer", desc: "A closing prayer to help you respond to what you've just read." },
];

const featured = BEAUTIFUL_TODAY.find((b) => b.featured) ?? BEAUTIFUL_TODAY[0];
const archive = BEAUTIFUL_TODAY.filter((b) => b !== featured);

export default function BeautifulTodayPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast.success("You're subscribed! Look out for next month's issue.");
      setEmail("");
      setSubmitting(false);
    }, 600);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#140929] py-24">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-primary/20 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300 backdrop-blur">
              <BookOpen className="h-3.5 w-3.5" /> TCC Monthly Devotional Series
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-5 text-4xl font-bold text-white md:text-6xl">
              Beautiful{" "}
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                Today
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
              Written by Pastor Isaac Etukudoh, Beautiful Today is a new devotional released every
              month — scripture, reflection, and prayer to help you meet God fresh, right where
              you are, today.
            </p>
          </Reveal>
        </div>
      </section>

      {/* What it offers */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Inside every issue</span>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Built for everyday life</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Each issue is written to walk with you through an entire month, one day at a time.
          </p>
        </Reveal>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="mt-10 grid gap-5 sm:grid-cols-3"
        >
          {PILLARS.map((p) => (
            <motion.div
              key={p.title}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -6 }}
              className="rounded-2xl border border-border bg-secondary/40 p-6"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Featured issue */}
      <section className="relative overflow-hidden bg-[#140929] py-24">
        <div className="relative mx-auto max-w-6xl px-4">
          <Reveal className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">Latest Issue</span>
          </Reveal>
          <div className="mt-12 grid items-center gap-10 lg:grid-cols-5">
            <Reveal delay={0.12} className="lg:col-span-2">
              <motion.div
                whileHover={{ y: -8, rotate: -1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative mx-auto max-w-xs"
              >
                <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-amber-400/25 to-transparent blur-2xl" />
                <div className="relative overflow-hidden rounded-[1.75rem] border-4 border-white/10 shadow-2xl shadow-black/50">
                  <img
                    src={featured.img}
                    alt={`Beautiful Today, ${featured.month} — ${featured.tag}`}
                    className="aspect-[4/5] w-full object-cover"
                  />
                </div>
                <div className="absolute -right-3 -top-3 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-bold text-[#140929] shadow-lg">
                  New This Month
                </div>
              </motion.div>
            </Reveal>
            <Reveal delay={0.2} className="lg:col-span-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                {featured.month} &middot; {featured.tag}
              </span>
              <div className="mt-3 flex gap-3">
                <Quote className="h-6 w-6 shrink-0 text-amber-400/70" />
                <p className="text-xl font-semibold leading-snug text-white md:text-2xl">
                  {featured.quote}
                </p>
              </div>
              <p className="mt-4 max-w-xl text-white/70">{featured.desc}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-[#140929] shadow-lg shadow-amber-400/20 transition-transform hover:scale-105"
                >
                  Get Your Copy <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
                >
                  Partner With The Series
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Full archive */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">The archive</span>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Past Issues</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Catch up on months you missed, or revisit a series that met you where you were.
          </p>
        </Reveal>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {archive.map((b) => (
            <motion.div
              key={b.month}
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3 }}
              className="group overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-sm"
            >
              <div className="overflow-hidden">
                <img
                  src={b.img}
                  alt={`Beautiful Today, ${b.month} — ${b.tag}`}
                  className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  {b.month}
                </span>
                <h3 className="mt-1.5 font-semibold leading-snug">{b.tag}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Subscribe */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] px-8 py-14 text-center text-white shadow-xl shadow-primary/20 md:px-16">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-accent/80" />
            <div className="relative">
              <BookOpen className="mx-auto h-9 w-9 text-amber-300" />
              <h2 className="mt-4 text-2xl font-bold md:text-3xl">Never miss an issue</h2>
              <p className="mx-auto mt-3 max-w-md text-white/85">
                Get each new Beautiful Today devotional delivered to your inbox as soon as it releases.
              </p>
              <form onSubmit={handleSubscribe} className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full flex-1 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-white/60 outline-none backdrop-blur focus:border-white/50"
                />
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={submitting}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary shadow-lg disabled:opacity-60"
                >
                  <Send className="h-4 w-4" /> {submitting ? "Subscribing…" : "Subscribe"}
                </motion.button>
              </form>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
