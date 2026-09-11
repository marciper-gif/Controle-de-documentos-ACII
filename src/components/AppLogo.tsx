// ─────────────────────────────────────────────────────────────────────
// Fase 4 (rebranding) — substitui o antigo ACIILogo.tsx.
// ─────────────────────────────────────────────────────────────────────
// Logo do produto ("Normatiza"), usado no cabeçalho oficial dos
// documentos exportados/impressos. Cada empresa pode subir o próprio
// logo (Company.logoUrl, editável na aba "Identidade Visual" do painel
// admin — ver AdminUsersModal.tsx e firestore.rules) — quando existe,
// é ele que aparece aqui, no lugar da marca padrão. `primaryColor`
// (também por empresa) tinge o acento do emblema padrão quando não há
// logo próprio. Retingir o app inteiro com a cor da empresa (botões,
// links, etc.) é trabalho de design tokens — a Fase 5 do prompt já
// separa isso explicitamente ("definir tokens de design, não valores
// soltos por componente"), então não foi feito aqui.
interface AppLogoProps {
  className?: string;
  logoUrl?: string;
  primaryColor?: string;
}

export default function AppLogo({ className = "w-full h-auto", logoUrl, primaryColor }: AppLogoProps) {
  if (logoUrl) {
    return <img src={logoUrl} alt="Logo da empresa" className={`${className} object-contain`} />;
  }

  const accent = primaryColor || '#10b981'; // emerald-500, cor padrão do produto

  return (
    <svg viewBox="0 0 280 90" className={className} xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(5, 5)">
        {/* Marca padrão do produto */}
        <text
          x="0"
          y="42"
          style={{
            fontFamily: '"Space Grotesk", "Inter", sans-serif',
            fontSize: '34px',
            fontWeight: 900,
            letterSpacing: '-1px'
          }}
          className="fill-slate-900 dark:fill-white font-black"
        >
          Normatiza
        </text>

        {/* Marcador de acento — cor da empresa quando configurada */}
        <rect x="0" y="52" width="46" height="5" rx="2.5" fill={accent} />

        <text
          x="0"
          y="76"
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '1.2px'
          }}
          className="fill-slate-500 dark:fill-slate-400"
        >
          CONTROLE DE DOCUMENTOS E PROCESSOS
        </text>
      </g>
    </svg>
  );
}
