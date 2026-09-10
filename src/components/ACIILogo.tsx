export default function ACIILogo({ className = "w-full h-auto" }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 110" className={className} xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(5, 5)">
        {/* ACII Bold Green Text */}
        <text
          x="0"
          y="50"
          style={{
            fontFamily: '"Space Grotesk", "Inter", sans-serif',
            fontSize: '56px',
            fontWeight: 900,
            letterSpacing: '-2px'
          }}
          className="fill-emerald-600 dark:fill-emerald-400 font-black"
        >
          ACII
        </text>

        {/* Shutter Swirl Icon */}
        <g transform="translate(145, 2)">
          {/* Green rounded background box */}
          <rect width="52" height="52" rx="10" className="fill-emerald-600 dark:fill-emerald-500" />

          {/* Outer circle layout */}
          <circle cx="26" cy="26" r="21" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.3" />

          {/* Golden Yellow sun center circle */}
          <circle cx="26" cy="26" r="11" fill="#fbc02d" />

          {/* Curved white/green swirl blades / shutter arcs */}
          <path d="M 26,5 A 21,21 0 0,1 47,26 L 37,26 A 11,11 0 0,0 26,15 Z" fill="#ffffff" />
          <path d="M 47,26 A 21,21 0 0,1 26,47 L 26,37 A 11,11 0 0,0 37,26 Z" fill="#ffffff" />
          <path d="M 26,47 A 21,21 0 0,1 5,26 L 15,26 A 11,11 0 0,0 26,37 Z" fill="#ffffff" />
          <path d="M 5,26 A 21,21 0 0,1 26,5 L 26,15 A 11,11 0 0,0 15,26 Z" fill="#ffffff" />
        </g>

        {/* Subtitle Lines */}
        <text
          x="0"
          y="74"
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '1px'
          }}
          className="fill-slate-800 dark:fill-slate-200 font-bold"
        >
          ASSOCIAÇÃO COMERCIAL
        </text>
        <text
          x="0"
          y="87"
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '1px'
          }}
          className="fill-slate-800 dark:fill-slate-200 font-bold"
        >
          INDUSTRIAL E SERVIÇOS
        </text>
        <text
          x="0"
          y="100"
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '1px'
          }}
          className="fill-slate-800 dark:fill-slate-200 font-bold"
        >
          DE IMPERATRIZ
        </text>
      </g>
    </svg>
  );
}
