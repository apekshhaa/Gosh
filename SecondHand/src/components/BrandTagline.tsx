import { BRAND_TAGLINE } from '../constants/brand';

interface BrandTaglineProps {
  className?: string;
}

/** Shared mono tagline — used in header, footer, and mobile menu */
export default function BrandTagline({ className = '' }: BrandTaglineProps) {
  return (
    <p
      className={`font-mono text-[7px] sm:text-[8px] tracking-[0.1em] text-luxury-gray uppercase leading-[1.6] text-center max-w-[17rem] mx-auto ${className}`}
    >
      {BRAND_TAGLINE}
    </p>
  );
}
