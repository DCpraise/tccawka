"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { Reveal } from "@/components/site/reveal";
import { EVENTS, SERVICE_TIMES, CHURCH_CONTACT } from "@/lib/site-data";

export default function EventsPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#140929] py-24">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-primary/20 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300 backdrop-blur">
              <Calendar className="h-3.5 w-3.5" /> What's happening
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-5 text-4xl font-bold text-white md:text-6xl">
              Upcoming{" "}
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                Events
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              From our weekly gatherings to special services throughout the year — here&apos;s
              what&apos;s on at TCC Global.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Events list */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="space-y-5"
        >
          {EVENTS.map((e) => (
            <motion.div
              key={e.title}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ x: 4 }}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between md:p-8"
            >
              <div>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">{e.tag}</span>
                <h3 className="mt-3 text-xl font-semibold">{e.title}</h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{e.desc}</p>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary" /> {e.date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" /> {e.time}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" /> {CHURCH_CONTACT.address}
                  </span>
                </div>
              </div>
              <Link
                href="/contact"
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:border-primary hover:text-primary"
              >
                I&apos;m Interested <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Weekly rhythm */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Every week</span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">Our Weekly Rhythm</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Beyond special events, here&apos;s when we gather every week — come as you are.
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
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 py-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] px-8 py-14 text-center text-white shadow-xl shadow-primary/20 md:px-16">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-accent/80" />
            <div className="relative">
              <h2 className="text-2xl font-bold md:text-3xl">Have a question about an event?</h2>
              <p className="mx-auto mt-3 max-w-md text-white/85">
                Reach out and our team will get you all the details you need.
              </p>
              <Link
                href="/contact"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 font-medium text-primary shadow-lg"
              >
                Contact Us <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
