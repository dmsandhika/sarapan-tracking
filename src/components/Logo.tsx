export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Jompesan"
    >
      <rect x="1.5" y="1.5" width="29" height="29" rx="9" fill="var(--accent)" stroke="var(--border)" strokeWidth="2.5" />
      <rect x="8" y="14" width="13" height="9" rx="3" fill="#fff" stroke="var(--border)" strokeWidth="2" />
      <path
        d="M21 16.5 a3 3 0 0 1 0 5"
        fill="none"
        stroke="var(--border)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M12 11.5 c-1 -1.5 1 -2.3 0 -4" fill="none" stroke="var(--border)" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 11.5 c-1 -1.5 1 -2.3 0 -4" fill="none" stroke="var(--border)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
