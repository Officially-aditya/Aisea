import Link from "next/link";

type BrandLogoProps = {
  title?: string;
};

type BrandLinkProps = {
  href?: string;
  label: string;
  className?: string;
};

export function BrandLogo({ title = "AISEA" }: BrandLogoProps) {
  return (
    <span aria-hidden="true" className="brand-mark">
      <svg fill="none" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <title>{title}</title>
        <circle cx="28" cy="28" fill="rgba(255,255,255,0.08)" r="21" />
        <circle cx="28" cy="28" r="17.5" stroke="currentColor" strokeWidth="4.5" />
        <path d="M40.5 40.5L54 54" stroke="currentColor" strokeLinecap="round" strokeWidth="6" />
        <text
          fill="currentColor"
          fontFamily="Arial, sans-serif"
          fontSize="15"
          fontWeight="700"
          letterSpacing="-0.08em"
          textAnchor="middle"
          x="28"
          y="33.5"
        >
          AI
        </text>
      </svg>
    </span>
  );
}

export function BrandLink({ href = "/", label, className }: BrandLinkProps) {
  return (
    <Link className={className ? `brand ${className}` : "brand"} href={href}>
      <BrandLogo title={label} />
      <span>{label}</span>
    </Link>
  );
}