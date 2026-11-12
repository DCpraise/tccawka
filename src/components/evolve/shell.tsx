"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { SOCIAL_LINKS } from "@/lib/site-data";
import { EVOLVE } from "@/lib/evolve-config";

function Logo({ small = false }: { small?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img src="/images/evolve-emblem.png" alt="" className={small ? "h-9 w-auto" : "h-11 w-auto md:h-12"} />
      <span className={`evolve-logo-text whitespace-nowrap ${small ? "text-xs" : "text-[0.78rem] sm:text-base md:text-lg"}`}>The Crowned Church</span>
    </span>
  );
}

// Page frame for the Evolve-only site: flyer-style background, logo-only header (no navigation), footer.
export function EvolveShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="evolve-root relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#e6f0ff] via-[#f7f9ff] to-[#efe6ff]">
      <div aria-hidden className="pointer-events-none absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-[#bcd4ff]/50 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-32 top-40 h-[30rem] w-[30rem] rounded-full bg-[#dcc8ff]/50 blur-3xl" />

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/evolve" aria-label="The Crowned Church">
          <Logo />
        </Link>
        <a href={EVOLVE.phoneHref} className="hidden items-center gap-2 rounded-full border border-indigo-100 bg-white/70 px-4 py-2 text-sm font-medium text-[#3b4de8] backdrop-blur sm:inline-flex">
          <Phone className="h-4 w-4" /> {EVOLVE.phone}
        </a>
      </header>

      <div className="relative z-10">{children}</div>

      <footer className="relative z-10 border-t border-indigo-100 bg-white/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 px-5 py-8 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-4">
            <Logo small />
            <p className="text-xs text-[#5b6280]">© {new Date().getFullYear()} The Crowned Church. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-3">
            {SOCIAL_LINKS.map(({ Icon, url, label }) => (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer" aria-label={label}
                className="grid h-10 w-10 place-items-center rounded-full border border-indigo-100 bg-white text-[#3b4de8] transition-transform hover:-translate-y-0.5">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  );
}
