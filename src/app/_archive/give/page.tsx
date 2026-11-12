"use client";

import { motion } from "framer-motion";
import { Gift, HandCoins, Building2, MessageCircle, ArrowRight, Quote } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { Reveal } from "@/components/site/reveal";
import { GIVING_CATEGORIES, CHURCH_CONTACT } from "@/lib/site-data";

const WAYS_TO_GIVE = [
  {
    icon: HandCoins,
    title: "In Person",
    desc: "Give during any of our Sunday services or the Wednesday Bible study — offering baskets are passed during every gathering.",
  },
  {
    icon: Building2,
    title: "Bank Transfer",
    desc: "For our current account details, message our team on WhatsApp or by email and we'll send them straight to you.",
  },
  {
    icon: MessageCircle,
    title: "Talk to Our Team",
    desc: "Have a question about giving, receipts, or a specific project you'd like to support? We're happy to help.",
  },
];

export default function GivePage() {
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
              <Gift className="h-3.5 w-3.5" /> Give
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-5 text-4xl font-bold text-white md:text-6xl">
              Sow into{" "}
              <span className="bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
                the Kingdom
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/70">
              Your generosity helps TCC Global reach people, grow disciples, and serve our
              community. Thank you for partnering with us.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Scripture */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <Reveal>
          <Quote className="mx-auto h-7 w-7 text-primary/40" />
          <p className="mt-4 text-xl font-semibold leading-snug text-foreground md:text-2xl">
            &ldquo;Give, and it will be given to you. Good measure, pressed down, shaken
            together, running over, will be put into your lap.&rdquo;
          </p>
          <p className="mt-3 text-sm font-medium text-muted-foreground">Luke 6:38</p>
        </Reveal>
      </section>

      {/* Giving categories */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <Reveal className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Where it goes</span>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">Ways to Partner</h2>
        </Reveal>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="mt-10 grid gap-4 sm:grid-cols-2"
        >
          {GIVING_CATEGORIES.map((c) => (
            <motion.div
              key={c.title}
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-border bg-secondary/40 p-6"
            >
              <h3 className="font-semibold">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How to give */}
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">How to give</span>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">A Few Simple Ways</h2>
          </Reveal>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
            className="mt-10 grid gap-4 sm:grid-cols-3"
          >
            {WAYS_TO_GIVE.map((w) => (
              <motion.div
                key={w.title}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                whileHover={{ y: -6 }}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <w.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{w.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{w.desc}</p>
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
              <Gift className="mx-auto h-9 w-9 text-amber-300" />
              <h2 className="mt-4 text-2xl font-bold md:text-3xl">Ready to give?</h2>
              <p className="mx-auto mt-3 max-w-md text-white/85">
                Message our team on WhatsApp for account details, or reach out with any questions.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <a
                  href={CHURCH_CONTACT.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 font-medium text-primary shadow-lg"
                >
                  Chat on WhatsApp <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 px-8 py-3.5 font-medium hover:bg-white/10"
                >
                  Contact Us
                </a>
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
