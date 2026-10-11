import React from 'react';
import { ViewState } from '../types';
import BrandTagline from './BrandTagline';

interface FooterProps { setView: (view: ViewState) => void; }

export default function Footer({ setView }: FooterProps) {
  const linkClass = 'min-h-10 text-left text-xs text-luxury-gray underline-offset-4 hover:text-luxury-charcoal hover:underline';
  return <footer className="border-t border-luxury-border bg-[#f4eee6] text-luxury-charcoal">
    <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 sm:grid-cols-2 md:grid-cols-4 md:px-12">
      <div><h3 className="font-serif text-2xl tracking-[0.15em]">GOSH</h3><BrandTagline className="mt-2 !mx-0 !text-left" /><p className="mt-4 max-w-xs text-xs leading-5 text-luxury-gray">Shop pre-loved finds or list your own clothes for a second life.</p></div>
      <div><h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em]">Explore</h4><div className="flex flex-col items-start"><button className={linkClass} onClick={() => setView('home')}>Home</button><button className={linkClass} onClick={() => setView('shop')}>Shop all</button><button className={linkClass} onClick={() => setView('womens')}>Women</button><button className={linkClass} onClick={() => setView('wishlist')}>Wishlist</button></div></div>
      <div><h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em]">Information</h4><div className="flex flex-col items-start"><button className={linkClass} onClick={() => setView('about')}>About GOSH</button><a className={`${linkClass} inline-flex items-center`} href="https://wa.me/917338546697" target="_blank" rel="noreferrer">Contact via WhatsApp</a><a className={`${linkClass} inline-flex items-center`} href="https://wa.me/917338546697?text=Hi%20GOSH%2C%20I%E2%80%99d%20like%20to%20list%20clothes%20for%20sale." target="_blank" rel="noreferrer">Sell with GOSH</a></div></div>
      <div><h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em]">Shipping</h4><p className="text-xs leading-5 text-luxury-gray">Shipping is charged separately. Free shipping applies to orders over ₹900. Message us to confirm delivery details.</p></div>
    </div>
    <div className="border-t border-luxury-border px-6 py-5 text-center text-[10px] tracking-wide text-luxury-gray">© {new Date().getFullYear()} GOSH</div>
  </footer>;
}
