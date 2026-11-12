// Decorative translucent "glass ribbon" swirl, inspired by the Evolve flyer artwork.
export function GlassRibbons({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 600" className={className} aria-hidden fill="none">
      <defs>
        <linearGradient id="gr-a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#bfdbfe" /><stop offset=".5" stopColor="#818cf8" /><stop offset="1" stopColor="#c084fc" /></linearGradient>
        <linearGradient id="gr-b" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#93c5fd" /><stop offset=".6" stopColor="#6366f1" /><stop offset="1" stopColor="#e879f9" /></linearGradient>
        <linearGradient id="gr-c" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#c7d2fe" /><stop offset="1" stopColor="#60a5fa" /></linearGradient>
      </defs>
      <g strokeLinecap="round">
        <ellipse cx="320" cy="300" rx="270" ry="120" transform="rotate(-32 320 300)" stroke="url(#gr-a)" strokeWidth="38" opacity=".5" />
        <ellipse cx="320" cy="300" rx="270" ry="120" transform="rotate(-32 320 300)" stroke="#fff" strokeWidth="3" opacity=".7" />
        <ellipse cx="330" cy="310" rx="215" ry="92" transform="rotate(-32 330 310)" stroke="url(#gr-b)" strokeWidth="30" opacity=".5" />
        <ellipse cx="330" cy="310" rx="215" ry="92" transform="rotate(-32 330 310)" stroke="#fff" strokeWidth="2.5" opacity=".6" />
        <ellipse cx="340" cy="320" rx="160" ry="66" transform="rotate(-32 340 320)" stroke="url(#gr-c)" strokeWidth="24" opacity=".55" />
        <ellipse cx="340" cy="320" rx="160" ry="66" transform="rotate(-32 340 320)" stroke="#fff" strokeWidth="2" opacity=".6" />
        <ellipse cx="350" cy="330" rx="105" ry="42" transform="rotate(-32 350 330)" stroke="url(#gr-a)" strokeWidth="16" opacity=".5" />
      </g>
      <g opacity=".6">
        <rect x="410" y="60" width="120" height="70" rx="10" fill="url(#gr-b)" transform="rotate(18 470 95)" />
        <rect x="60" y="400" width="90" height="56" rx="9" fill="url(#gr-c)" transform="rotate(-14 105 428)" />
        <rect x="470" y="440" width="70" height="44" rx="8" fill="url(#gr-a)" transform="rotate(24 505 462)" />
      </g>
    </svg>
  );
}
