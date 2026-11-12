import type { Metadata } from "next";
import "./evolve.css";

const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: "Evolve | The Crowned Church",
  description: "Evolve ...your personal transformation. Live with Pastor Isaac, 19th – 22nd November 2026, Awka. Register now.",
  openGraph: {
    title: "Evolve ...your personal transformation",
    description: "Live with Pastor Isaac · 19th – 22nd Nov 2026 · 8AM & 4PM daily · Awka, Anambra State. Register now.",
    images: [{ url: "/images/evolve-flyer.jpg", width: 1080, height: 754 }],
    type: "website",
  },
  twitter: { card: "summary_large_image", images: ["/images/evolve-flyer.jpg"] },
};

export default function EvolveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
