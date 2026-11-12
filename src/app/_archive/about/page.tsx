"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Compass, ArrowRight, Quote } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { Reveal } from "@/components/site/reveal";
import { PURPOSE_PILLARS, CORE_VALUES, PASTOR, HISTORY_MILESTONES } from "@/lib/site-data";

export default function AboutPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#140929]">
        <div className="absolute inset-0">
          <img
            src="/images/gallery-3.jpg"
            alt="Members of the TCC Global congregation"
            className="h-full w-full object-cover opacity-[0.4]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#140929] via-[#140929]/95 to-[#140929]/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#140929] via-transparent to-[#140929]/70" />
        </div>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-amber-400/15 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center md:py-28">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300 backdrop-blur">
              Who we are
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] text-white md:text-5xl lg:text-6xl">
              About{" "}
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                TCC Global
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              TCC Global exists to help people know God, grow in faith, and discover their
              purpose — in a community that feels like home.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-[2rem] shadow-xl shadow-primary/10"
          >
            <img
              src="/images/gallery-5.jpg"
              alt="TCC Global congregation gathered in worship"
              className="h-[380px] w-full object-cover md:h-[440px]"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Our story</span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">A family, not just a service</h2>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              TCC Global — The Crowned Church — began with a simple conviction: that every
              person carries something valuable placed there by God, and a healthy church
              exists to help them find it, grow it, and give it away.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Over the years, that conviction has shaped everything from our Sunday gatherings
              to our fellowships to Beautiful Today, our monthly devotional written to meet
              people exactly where they are. Whether you&apos;re visiting for the first time or
              you&apos;ve called TCC Global home for years, you belong here.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {HISTORY_MILESTONES.map((m) => (
                <div key={m.title} className="rounded-2xl border border-border bg-secondary/40 p-4 text-center">
                  <div className="text-xl font-bold text-primary md:text-2xl">{m.year}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{m.title}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="relative overflow-hidden bg-[#140929] py-24">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-400/10 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300 backdrop-blur">
              <Compass className="h-3.5 w-3.5" /> Our Purpose
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

      {/* Core Values */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">What we stand on</span>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Our Core Values</h2>
        </Reveal>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {CORE_VALUES.map((v) => (
            <motion.div
              key={v.title}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="rounded-2xl border border-border bg-white p-6 text-center shadow-sm"
            >
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{v.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{v.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Pastor */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid items-center gap-10 md:grid-cols-5">
            <Reveal className="md:col-span-2">
              <div className="relative mx-auto max-w-xs">
                <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-transparent blur-2xl" />
                <div className="relative overflow-hidden rounded-[1.75rem] border-4 border-white shadow-2xl shadow-primary/10">
                  <img
                    src={PASTOR.img}
                    alt={PASTOR.name}
                    className="aspect-[4/5] w-full object-cover"
                  />
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="md:col-span-3">
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Leadership</span>
              <h2 className="mt-3 text-2xl font-bold md:text-3xl">{PASTOR.name}</h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{PASTOR.title}</p>
              <div className="mt-4 flex gap-3">
                <Quote className="h-5 w-5 shrink-0 text-primary/50" />
                <p className="leading-relaxed text-muted-foreground">{PASTOR.bio}</p>
              </div>
            </Reveal>
          </div>
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
              <h2 className="text-3xl font-bold md:text-4xl">Come see for yourself.</h2>
              <p className="mx-auto mt-3 max-w-lg text-white/90">
                There&apos;s a seat for you this Sunday — come as you are.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/contact" className="rounded-full bg-white px-8 py-3.5 font-medium text-primary shadow-lg">
                  Plan Your Visit
                </Link>
                <Link href="/#services" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-8 py-3.5 font-medium hover:bg-white/10">
                  See Service Times <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
      <WhatsAppButton />
    </div>
  );
}
