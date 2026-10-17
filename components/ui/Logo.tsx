/** The Recoup mark (a clockwise arrow: money coming back), in black. The marigold one is public/recoup-mark.svg. */
export function LogoMark({ size = 24, round = false, marigold = false, className }: { size?: number; round?: boolean; marigold?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} aria-hidden className={`shrink-0 ${className ?? ""}`}>
      {/* Round when it sits in a pill, so it nests in the pill's curved end. */}
      <rect width="96" height="96" rx={round ? 48 : 26} fill={marigold ? "#ecad45" : "#1d1f21"} />
      <path d="M64.85 62.14A22 22 0 1 1 61.5 32.2" fill="none" stroke="#fff" strokeWidth="8.5" strokeLinecap="round" />
      <path d="M73 41.5 54.5 37.5 67.5 23z" fill="#fff" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

/** Mark + wordmark. Size the wordmark with a text class; the mark follows `size`. */
export function Logo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <span className={`font-display inline-flex items-center gap-2 font-extrabold tracking-tight ${className ?? ""}`}>
      <LogoMark size={size} />
      Recoup
    </span>
  );
}
