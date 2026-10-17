/** A line icon drawn from SVG paths on a 24px grid, in the current text colour. */
export function Icon({ paths, className }: { paths: string[]; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {paths.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}
