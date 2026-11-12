"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, MapPin, Phone, Mail } from "lucide-react";
import { CHURCH_CONTACT, SERVICE_TIMES, SOCIAL_LINKS } from "@/lib/site-data";

const QUICK_LINKS = [
  { label: "About Us", href: "/#about" },
  { label: "Beautiful Today", href: "/beautiful-today" },
  { label: "Sermons", href: "/#sermons" },
  { label: "Events", href: "/#events" },
  { label: "Contact", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md">
                <Crown className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <div className="font-display text-base font-bold">TCC</div>
                <div className="text-[11px] text-muted-foreground">The Crowned Church</div>
              </div>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A warm, growing family of believers helping people discover, develop, and deploy
              their God-given abilities.
            </p>
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

          <div>
            <div className="text-sm font-semibold">Quick Links</div>
            <ul className="mt-4 space-y-2.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-muted-foreground hover:text-primary">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold">Get in Touch</div>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {CHURCH_CONTACT.address}
              </li>
              <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href={CHURCH_CONTACT.phoneHref} className="hover:text-primary">{CHURCH_CONTACT.phone}</a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <a href={`mailto:${CHURCH_CONTACT.email}`} className="hover:text-primary break-all">{CHURCH_CONTACT.email}</a>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold">Service Times</div>
            <ul className="mt-4 space-y-2.5">
              {SERVICE_TIMES.map((s) => (
                <li key={s.name} className="text-sm text-muted-foreground">
                  <div className="font-medium text-foreground">{s.day} · {s.name}</div>
                  <div>{s.time}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-8 text-center text-sm text-muted-foreground sm:flex-row sm:text-left">
          <span>© {new Date().getFullYear()} TCC Global. All rights reserved.</span>
          <span>Orchid Hotel, Orchid Road, Lekki</span>
        </div>
      </div>
    </footer>
  );
}
