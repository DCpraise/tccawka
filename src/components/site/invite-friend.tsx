"use client";

import { toast } from "sonner";
import { Share2, MessageCircle, Link2 } from "lucide-react";
import { EVOLVE } from "@/lib/evolve-config";

export function InviteFriend({ dark = false }: { dark?: boolean }) {
  const link = () => `${window.location.origin}/evolve`;
  const text = () =>
    `You're invited to *${EVOLVE.name}* ${EVOLVE.tagline} — live with ${EVOLVE.speaker}!\n📅 ${EVOLVE.dateLabel} (${EVOLVE.sessions.join(" & ")} daily)\n📍 ${EVOLVE.venue}\n\nRegister here: ${link()}`;

  const whatsapp = () => window.open(`https://wa.me/?text=${encodeURIComponent(text())}`, "_blank", "noopener");
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: "Evolve", text: text(), url: link() }); } catch {} }
    else whatsapp();
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(link()); toast.success("Link copied!"); } catch { toast.error("Couldn't copy the link."); }
  };

  const btn = dark
    ? "border-white/25 bg-white/10 text-white hover:bg-white/20"
    : "border-indigo-100 bg-white text-[#3b4de8] hover:border-[#5b5be8]";

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button onClick={whatsapp} className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-lg">
        <MessageCircle className="h-4 w-4" /> Invite a friend on WhatsApp
      </button>
      <button onClick={share} className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium ${btn}`}>
        <Share2 className="h-4 w-4" /> Share
      </button>
      <button onClick={copy} className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium ${btn}`}>
        <Link2 className="h-4 w-4" /> Copy link
      </button>
    </div>
  );
}
