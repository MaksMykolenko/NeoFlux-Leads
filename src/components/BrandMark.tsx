interface BrandMarkProps {
  className?: string;
}

export default function BrandMark({ className = "h-8 w-8" }: BrandMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      role="img"
      aria-label="NeoFlux"
      className={className}
    >
      <defs>
        <linearGradient id="nf-mark-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#nf-mark-gradient)" />
      <path d="M19 47V17h6l13 17V17h6v30h-6L25 30v17z" fill="#ffffff" />
    </svg>
  );
}
