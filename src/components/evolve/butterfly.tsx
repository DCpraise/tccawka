"use client";

import { motion } from "framer-motion";

export function Butterfly({ className }: { className?: string }) {
  return (
    <motion.svg viewBox="0 0 100 100" className={className} aria-hidden
      animate={{ rotate: [-4, 4, -4], y: [0, -3, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
      <defs>
        <linearGradient id="bf-up" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f472b6" /><stop offset="1" stopColor="#8b5cf6" /></linearGradient>
        <linearGradient id="bf-low" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2dd4bf" /><stop offset="1" stopColor="#6366f1" /></linearGradient>
      </defs>
      <motion.g style={{ originX: "50px", originY: "50px" }} animate={{ scaleX: [1, 0.82, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M50 48 C30 8 4 14 9 38 C12 51 35 56 50 48Z" fill="url(#bf-up)" />
        <path d="M50 48 C70 8 96 14 91 38 C88 51 65 56 50 48Z" fill="url(#bf-up)" />
        <path d="M50 52 C33 55 17 63 24 82 C30 94 47 79 50 52Z" fill="url(#bf-low)" />
        <path d="M50 52 C67 55 83 63 76 82 C70 94 53 79 50 52Z" fill="url(#bf-low)" />
        <path d="M30 28 C24 30 18 36 20 41" stroke="#fff" strokeOpacity=".45" strokeWidth="1.5" fill="none" />
        <path d="M70 28 C76 30 82 36 80 41" stroke="#fff" strokeOpacity=".45" strokeWidth="1.5" fill="none" />
      </motion.g>
      <ellipse cx="50" cy="54" rx="2.4" ry="15" fill="#3b1d5a" />
      <path d="M50 40 C47 30 43 26 40 24 M50 40 C53 30 57 26 60 24" stroke="#3b1d5a" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </motion.svg>
  );
}
