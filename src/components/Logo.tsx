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
      <rect width="32" height="32" rx="8" fill="var(--primary)" />
      <rect x="8" y="13" width="14" height="10" rx="3" fill="var(--background)" />
      <path
        d="M22 15.5 a3.2 3.2 0 0 1 0 6.4"
        fill="none"
        stroke="var(--background)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M12 11 c-1 -1.6 1 -2.4 0 -4"
        fill="none"
        stroke="var(--background)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18 11 c-1 -1.6 1 -2.4 0 -4"
        fill="none"
        stroke="var(--background)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
