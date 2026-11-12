"use client";

import { motion } from "framer-motion";
import { Play, Youtube, ArrowRight } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { Reveal } from "@/components/site/reveal";
import { SERMONS, SOCIAL_LINKS } from "@/lib/site-data";

const YOUTUBE = SOCIAL_LINKS.find((s) => s.label === "YouTube")!;

export default function SermonsPage() {
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
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300 backdrop-blur">
              Watch &amp; Listen
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-5 text-4xl font-bold text-white md:text-6xl">
              Sermon{" "}
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                Library
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Missed a Sunday, or want to revisit a message that spoke to you? Catch up on
              recent messages from TCC Global right here.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Sermons grid */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          className="grid gap-6 md:grid-cols-3"
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
              <div className="relative flex h-56 items-center justify-center overflow-hidden bg-[#140929]">
                <img
                  src={s.img}
                  alt={`Cover image for the sermon "${s.title}"`}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
                <div className="relative grid h-16 w-16 place-items-center rounded-full bg-red-600 shadow-lg ring-4 ring-white/20 transition-transform group-hover:scale-110">
                  <Play className="h-6 w-6 fill-white text-white" />
                </div>
              </div>
              <div className="p-5">
                <div className="text-xs font-medium text-muted-foreground">{s.date} · {s.speaker}</div>
                <h3 className="mt-1.5 font-semibold leading-snug">{s.title}</h3>
              </div>
            </motion.a>
          ))}
        </motion.div>
      </section>

      {/* YouTube CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <Reveal>
          <a
            href={YOUTUBE.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center justify-between gap-6 rounded-[2rem] border border-border bg-secondary/40 p-8 text-center sm:flex-row sm:text-left md:p-12"
          >
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-red-600 text-white shadow-lg">
                <Youtube className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold md:text-2xl">Every message, on YouTube</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Subscribe to The Crowned Church for full-length sermons every week.
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              Visit Channel <ArrowRight className="h-4 w-4" />
            </span>
          </a>
        </Reveal>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
