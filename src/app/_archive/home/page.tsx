"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Crown, Users, HeartHandshake, ShieldCheck,
  Clock, MapPin, Calendar, PlayCircle, Play, Phone, Mail, ArrowRight,
  Gift, MessageCircle, ChevronDown, BookOpen, Quote,
} from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { Reveal } from "@/components/site/reveal";
import {
  SERVICE_TIMES, BEAUTIFUL_TODAY, CHURCH_CONTACT, SOCIAL_LINKS,
  SERMONS, EVENTS, PURPOSE_PILLARS,
} from "@/lib/site-data";

const GET_INVOLVED = [
  { icon: Users, title: "Join a Fellowship", desc: "Find your small group and grow alongside people who'll walk with you.", href: "/contact" },
  { icon: HeartHandshake, title: "Volunteer", desc: "Serve on a team and use your gifts to bless the church family.", href: "/contact" },
  { icon: Gift, title: "Give", desc: "Support the ministry and mission of TCC Global with a gift.", href: "/give" },
  { icon: MessageCircle, title: "Prayer Request", desc: "Let our team stand with you in prayer over anything on your heart.", href: "/contact" },
];

const FAQS = [
  {
    q: "Do I need to register before attending a service?",
    a: "Not at all — just come as you are. If you'd like a smoother check-in on future visits, our welcome team can register you on-site.",
  },
  {
    q: "Is there anything for children?",
    a: "Yes, our children's ministry runs during both Sunday services so the whole family can worship together.",
  },
  {
    q: "What should I wear?",
    a: "Come exactly as you are — there's no dress code at TCC Global.",
  },
  {
    q: "How do I join a fellowship?",
    a: "Speak with any usher after service, or reach out through the contact section below, and we'll connect you with a fellowship near you.",
  },
];

// ————————————————————————————————————————————
// Small animation helpers
// ————————————————————————————————————————————

function AnimatedCounter({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [display, setDisplay] = useState(value.replace(/[0-9]/g, "0"));

  useEffect(() => {
    if (!isInView) return;
    const match = value.match(/^(\D*)([\d,]+)(.*)$/);
    if (!match) {
      setDisplay(value);
      return;
    }
    const [, prefix, numStr, suffix] = match;
    const target = parseInt(numStr.replace(/,/g, ""), 10);
    const duration = 1600;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      setDisplay(`${prefix}${current.toLocaleString()}${suffix}`);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isInView, value]);

  return <span ref={ref}>{display}</span>;
}

function InstagramEmbed({ url }: { url: string }) {
  useEffect(() => {
    const process = () => {
      const ig = (window as any).instgrm;
      if (ig) ig.Embeds.process();
    };
    const existing = document.getElementById("instagram-embed-script") as HTMLScriptElement | null;
    if (existing) {
      process();
    } else {
      const script = document.createElement("script");
      script.id = "instagram-embed-script";
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      script.onload = process;
      document.body.appendChild(script);
    }
  }, [url]);

  return (
    <blockquote
      className="instagram-media"
      data-instgrm-permalink={url}
      data-instgrm-version="14"
      style={{ background: "#000", margin: 0, width: "100%", minWidth: "326px" }}
    >
      <a href={url} />
    </blockquote>
  );
}

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={index * 0.06}>
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-4 p-5 text-left"
        >
          <span className="font-semibold">{q}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="h-4 w-4 shrink-0 text-primary" />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}

export default function HomePage() {
  // Very smooth, eased anchor scrolling (with sticky-nav offset) for every in-page link
  useEffect(() => {
    const NAV_OFFSET = 88;
    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement)?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!link) return;
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      const el = document.querySelector(hash);
      if (!el) return;

      e.preventDefault();
      const startY = window.scrollY;
      const targetY = el.getBoundingClientRect().top + startY - NAV_OFFSET;
      const distance = targetY - startY;
      const duration = Math.min(1400, Math.max(500, Math.abs(distance) * 0.6));
      let startTime: number | null = null;

      const step = (timestamp: number) => {
        if (startTime === null) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        window.scrollTo(0, startY + distance * easeInOutCubic(progress));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Header />
      <Link href="/evolve" className="block bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-center text-sm font-medium text-white hover:opacity-95">
        🚀 Evolve · 19–22 Nov · Awka — pre-register now and get your ticket <span className="underline">Register →</span>
      </Link>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#140929]">
        {/* Photographic backdrop */}
        <div className="absolute inset-0">
          <img
            src="/images/gallery-2.jpg"
            alt="A member of TCC Global worshipping during Sunday service"
            className="h-full w-full object-cover opacity-[0.45]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#140929] via-[#140929]/95 to-[#140929]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#140929] via-transparent to-[#140929]/70" />
        </div>

        {/* Floating ambient glow orbs */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl"
          animate={{ y: [0, -24, 0], x: [0, 12, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-primary/30 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -14, 0] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid items-center gap-14 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur">
                <Crown className="h-3.5 w-3.5" /> You are welcome here
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.05] text-white md:text-5xl lg:text-6xl">
                A place to{" "}
                <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                  belong
                </span>
                , believe, and become.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/70">
                TCC Global is a warm, growing family of believers. Join us for worship,
                fellowship, and a community that feels like home.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <motion.a
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  href="#services"
                  className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-6 py-3.5 font-medium text-[#140929] shadow-lg shadow-amber-500/20"
                >
                  Plan a Visit
                </motion.a>
                <motion.a
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  href="#watch"
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 font-medium text-white backdrop-blur"
                >
                  <PlayCircle className="h-4 w-4" /> Watch Highlights
                </motion.a>
              </div>
              <div className="mt-10 flex items-center gap-2 text-sm text-white/60">
                <Clock className="h-4 w-4 text-amber-300" /> Join us this Sunday — 7:00 AM &amp; 9:30 AM
              </div>
            </motion.div>

            {/* Signature photo card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto w-full max-w-[260px] md:max-w-[300px]"
            >
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-amber-400/25 to-transparent blur-2xl" />
              <div className="relative rounded-[2.25rem] border-4 border-white/10 bg-black p-1.5 shadow-2xl shadow-black/50">
                <img
                  src="/images/hero-pastor-preaching.jpg"
                  alt="Pastor Isaac Etukudoh ministering on stage at TCC Global"
                  className="aspect-[4/5] w-full rounded-[1.75rem] object-cover"
                />
              </div>
              <div className="glass absolute -bottom-5 -left-6 hidden rounded-2xl border border-white/10 bg-white/95 p-4 shadow-lg sm:block">
                <div className="text-xs font-semibold text-foreground">Sunday Worship</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">Ministering the Word</div>
              </div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
            className="mt-20 grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            {[
              { k: "20+", v: "Years of Ministry" },
              { k: "1,200+", v: "Church Family" },
              { k: "12+", v: "Fellowships" },
              { k: "100%", v: "Welcome" },
            ].map((s) => (
              <motion.div
                key={s.v}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur"
              >
                <div className="text-3xl font-bold text-amber-300 md:text-4xl">
                  <AnimatedCounter value={s.k} />
                </div>
                <div className="mt-1 text-sm text-white/60">{s.v}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Purpose / Vision */}
      <section id="purpose" className="relative overflow-hidden bg-[#140929] py-24">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300 backdrop-blur">
              Our Purpose
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-5 text-3xl font-bold text-white md:text-5xl">
              Vision &amp;{" "}
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                Mission
              </span>
            </h2>
          </Reveal>

          <div className="mx-auto mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
            <Reveal delay={0.14}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">Vision</span>
                <p className="mt-2 text-xl font-semibold leading-snug text-white">
                  Revealing the{" "}
                  <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                    Kingdom
                  </span>
                  .
                </p>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">Mission</span>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  To help people discover, develop and deploy their God-given abilities for
                  kingdom advancement and social transformation.
                </p>
              </div>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {PURPOSE_PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={0.24 + i * 0.1}>
                <motion.div
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-400/15 text-amber-300">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-white">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/60">{p.desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery / Moments */}
      <section id="moments" className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Moments</span>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Life at TCC Global</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            A glimpse into recent services — worship, fellowship, and celebration.
          </p>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 md:auto-rows-[240px]">
          <Reveal delay={0.05} className="group col-span-2 h-64 overflow-hidden rounded-[1.75rem] shadow-sm md:col-span-2 md:row-span-2 md:h-auto">
            <img src="/images/gallery-6.jpg" alt="A minister leading worship on stage with the choir at TCC Global" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </Reveal>
          <Reveal delay={0.12} className="group h-40 overflow-hidden rounded-2xl shadow-sm md:h-auto">
            <img src="/images/moments/vocalist-ministering.jpg" alt="A vocalist ministering in song on stage at TCC Global" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </Reveal>
          <Reveal delay={0.18} className="group h-40 overflow-hidden rounded-2xl shadow-sm md:h-auto">
            <img src="/images/moments/congregation-worship.jpg" alt="Members worshipping together in the congregation at TCC Global" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </Reveal>
          <Reveal delay={0.24} className="group col-span-2 h-40 overflow-hidden rounded-2xl shadow-sm md:col-span-3 md:h-auto">
            <img src="/images/moments/member-raising-hands.jpg" alt="A member raising hands in worship at TCC Global" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          </Reveal>
        </div>
      </section>

      {/* Watch */}
      <section id="watch" className="bg-[#140929] py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <Reveal>
            <span className="text-sm font-semibold uppercase tracking-wider text-amber-300">Watch</span>
            <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">Sunday Highlights</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/60">
              Missed a service or just want to relive the moment? Watch our latest highlight reel.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-10">
            <div className="mx-auto max-w-sm overflow-hidden rounded-[2rem] shadow-2xl shadow-black/50">
              <InstagramEmbed url="https://www.instagram.com/reel/DUgUh16DVS-/" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* About */}
      <section id="about" className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="order-2 overflow-hidden rounded-[2rem] shadow-xl shadow-primary/10 md:order-1"
          >
            <img
              src="/images/gallery-1.jpg"
              alt="A member of the TCC Global congregation"
              className="h-[380px] w-full object-cover md:h-[440px]"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="order-1 md:order-2"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Who we are</span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">About TCC Global</h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              TCC Global exists to help people know God, grow in faith, and discover their
              purpose. Whether you&apos;re exploring faith for the first time or looking for
              a church to call home, you&apos;ll find a welcoming community, sound teaching,
              and practical support for everyday life.
            </p>
            <Link
              href="/about"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80"
            >
              Learn more about us <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {[
                { icon: HeartHandshake, title: "Genuine Community", desc: "Small fellowship groups where everyone is known and cared for." },
                { icon: ShieldCheck, title: "Sound Teaching", desc: "Bible-based messages that are practical for everyday living." },
              ].map((f) => (
                <motion.div key={f.title} whileHover={{ y: -4 }} className="rounded-2xl border border-border bg-secondary/40 p-4">
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="h-4 w-4" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Beautiful Today — Monthly Devotional Series */}
      <section id="beautiful-today" className="relative overflow-hidden bg-[#140929] py-24">
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

        <div className="relative mx-auto max-w-6xl px-4">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300 backdrop-blur">
              <BookOpen className="h-3.5 w-3.5" /> TCC Monthly Devotional Series
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-5 text-center text-3xl font-bold text-white md:text-5xl">
              Beautiful{" "}
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                Today
              </span>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-relaxed text-white/70">
              Written by Pastor Isaac Etukudoh, Beautiful Today is a new devotional released every
              month — scripture, reflection, and prayer to help you meet God fresh, right where
              you are, today.
            </p>
          </Reveal>

          {/* Featured issue */}
          <div className="mt-16 grid items-center gap-10 lg:grid-cols-5">
            <Reveal delay={0.12} className="lg:col-span-2">
              <motion.div
                whileHover={{ y: -8, rotate: -1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="relative mx-auto max-w-xs"
              >
                <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-amber-400/25 to-transparent blur-2xl" />
                <div className="relative overflow-hidden rounded-[1.75rem] border-4 border-white/10 shadow-2xl shadow-black/50">
                  <img
                    src={BEAUTIFUL_TODAY[0].img}
                    alt={`Beautiful Today, ${BEAUTIFUL_TODAY[0].month} — ${BEAUTIFUL_TODAY[0].tag}`}
                    className="aspect-[4/5] w-full object-cover"
                  />
                </div>
                <div className="absolute -right-3 -top-3 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-bold text-[#140929] shadow-lg">
                  Latest Issue
                </div>
              </motion.div>
            </Reveal>

            <Reveal delay={0.2} className="lg:col-span-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                {BEAUTIFUL_TODAY[0].month} &middot; {BEAUTIFUL_TODAY[0].tag}
              </span>
              <div className="mt-3 flex gap-3">
                <Quote className="h-6 w-6 shrink-0 text-amber-400/70" />
                <p className="text-xl font-semibold leading-snug text-white md:text-2xl">
                  {BEAUTIFUL_TODAY[0].quote}
                </p>
              </div>
              <p className="mt-4 max-w-xl text-white/70">{BEAUTIFUL_TODAY[0].desc}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-[#140929] shadow-lg shadow-amber-400/20 transition-transform hover:scale-105"
                >
                  Get Your Copy <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
                >
                  Partner With The Series
                </a>
              </div>
            </Reveal>
          </div>

          {/* More issues */}
          <Reveal delay={0.1} className="mt-20 flex items-center justify-center gap-4">
            <h3 className="text-center text-sm font-semibold uppercase tracking-wider text-white/50">
              More In The Series
            </h3>
            <Link
              href="/beautiful-today"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-300 hover:text-amber-200"
            >
              View Full Archive <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Reveal>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
            className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {BEAUTIFUL_TODAY.slice(1).map((b) => (
              <motion.div
                key={b.month}
                variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="group flex gap-5 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur"
              >
                <div className="w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-lg">
                  <img
                    src={b.img}
                    alt={`Beautiful Today, ${b.month} — ${b.tag}`}
                    className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
                    {b.month}
                  </span>
                  <h4 className="mt-1 font-semibold text-white">{b.tag}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/60">{b.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Service Times */}
      <section id="services" className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Join us</span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Service Times</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              We&apos;d love to have you. Here&apos;s when we gather each week — come as you are.
            </p>
          </Reveal>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
            className="mt-10 grid gap-4 sm:grid-cols-3"
          >
            {SERVICE_TIMES.map((s) => (
              <motion.div
                key={s.name}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -6 }}
                className="rounded-2xl border border-border bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.day}</div>
                <h3 className="mt-1 font-semibold">{s.name}</h3>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-sm text-primary">
                  <Clock className="h-4 w-4" /> {s.time}
                </div>
              </motion.div>
            ))}
          </motion.div>
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            Orchid Hotel, Orchid Road, Lekki
          </div>
        </div>
      </section>

      {/* Sermons */}
      <section id="sermons" className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Latest messages</span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Recent Sermons</h2>
          </div>
          <a href="/sermons" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            View all sermons <ArrowRight className="h-4 w-4" />
          </a>
        </Reveal>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="mt-10 grid gap-6 md:grid-cols-3"
        >
          {SERMONS.map((s) => (
            <motion.a
              key={s.title}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -6 }}
              className="group block overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="relative flex h-44 items-center justify-center overflow-hidden bg-[#140929]">
                <img
                  src={s.img}
                  alt={`Cover image for the sermon "${s.title}"`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
                <div className="relative grid h-14 w-14 place-items-center rounded-full bg-red-600 shadow-lg ring-4 ring-white/20 transition-transform group-hover:scale-110">
                  <Play className="h-5 w-5 fill-white text-white" />
                </div>
              </div>
              <div className="p-5">
                <div className="text-xs font-medium text-muted-foreground">{s.date} · {s.speaker}</div>
                <h3 className="mt-1.5 font-semibold">{s.title}</h3>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </section>

      {/* Events */}
      <section id="events" className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">What's happening</span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Upcoming Events</h2>
          </Reveal>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
            className="mt-10 grid gap-4 sm:grid-cols-3"
          >
            {EVENTS.map((e) => (
              <motion.div
                key={e.title}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ x: 4 }}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm"
              >
                <div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">{e.tag}</span>
                  <h3 className="mt-2 font-semibold">{e.title}</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> {e.date} &middot; {e.time}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
              </motion.div>
            ))}
          </motion.div>
          <div className="mt-8 text-center">
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              View all events <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Get Involved */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Take the next step</span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Get Involved</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              There are many ways to plug in and grow at TCC Global.
            </p>
          </Reveal>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {GET_INVOLVED.map((g) => (
              <motion.div
                key={g.title}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <Link
                  href={g.href}
                  className="block h-full rounded-2xl border border-border bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <g.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{g.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{g.desc}</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] px-8 py-16 text-center text-white shadow-xl shadow-primary/20 md:px-16">
            <img
              src="/images/gallery-4.jpg"
              alt="A member celebrating at a TCC Global service"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/90 to-accent/80" />
            <div className="relative">
              <Crown className="mx-auto h-10 w-10 text-amber-300" />
              <h2 className="mt-4 text-3xl font-bold md:text-4xl">We can&apos;t wait to meet you.</h2>
              <p className="mx-auto mt-3 max-w-lg text-white/90">
                Come as you are. Find your seat, your community, and your crown at TCC Global.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} href="#services" className="rounded-full bg-white px-8 py-3.5 font-medium text-primary shadow-lg">
                  Plan Your Visit
                </motion.a>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Link href="/auth" className="block rounded-full border border-white/40 px-8 py-3.5 font-medium hover:bg-white/10">
                    Member Login
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20">
        <Reveal className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Good to know</span>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Frequently Asked Questions</h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => (
            <FaqItem key={f.q} q={f.q} a={f.a} index={i} />
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="mx-auto max-w-6xl px-4 pb-20">
        <Reveal className="grid gap-8 rounded-[2rem] border border-border bg-secondary/40 p-8 md:grid-cols-3 md:p-12">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Get in touch</span>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">We&apos;d love to hear from you</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Have a question, prayer request, or just want to say hello? Reach out anytime.
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:opacity-80"
            >
              Visit our full contact page <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <div className="mt-5 flex gap-3">
              {SOCIAL_LINKS.map(({ Icon, url, label }) => (
                <motion.a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="grid h-10 w-10 place-items-center rounded-full border border-border bg-white text-muted-foreground"
                >
                  <Icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><MapPin className="h-4 w-4" /></div>
              <div>
                <div className="text-sm font-semibold">Address</div>
                <div className="text-sm text-muted-foreground">{CHURCH_CONTACT.address}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Phone className="h-4 w-4" /></div>
              <div>
                <div className="text-sm font-semibold">Phone</div>
                <div className="text-sm text-muted-foreground">{CHURCH_CONTACT.phone}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Mail className="h-4 w-4" /></div>
              <div>
                <div className="text-sm font-semibold">Email</div>
                <div className="text-sm text-muted-foreground">{CHURCH_CONTACT.email}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold">Service Times</div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {SERVICE_TIMES.map((s) => (
                <li key={s.name} className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
                  <span>{s.day} · {s.name}</span>
                  <span className="font-medium text-foreground">{s.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
