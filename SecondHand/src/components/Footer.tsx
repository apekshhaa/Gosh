import React from 'react';
import { ViewState } from '../types';
import BrandTagline from './BrandTagline';

interface FooterProps { setView: (view: ViewState) => void; }

export default function Footer({ setView }: FooterProps) {
  return <footer className="border-t border-luxury-border bg-[#f4eee6] text-luxury-charcoal">
    <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-4 md:px-12">
      <div><h3 className="font-serif text-2xl tracking-[0.15em]">GOSH</h3><BrandTagline className="mt-2 !mx-0 !text-left"/><p className="mt-5 max-w-xs text-xs leading-5 text-luxury-gray">A growing collection of pre-loved clothing. Shipping is charged separately.</p></div>
      <div><h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em]">Browse</h4><div className="flex flex-col items-start gap-3 text-xs text-luxury-gray"><button onClick={() => setView('home')}>Home</button><button onClick={() => setView('shop')}>View all items</button></div></div>
      <div><h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em]">Shipping</h4><p className="text-xs leading-5 text-luxury-gray">Free shipping applies to orders over ₹900. Shipping is charged separately on smaller orders.</p></div>
      <div><h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em]">More photos?</h4><p className="text-xs leading-5 text-luxury-gray">Message us on WhatsApp for extra angles of any item.</p><a href="https://wa.me/917338546697" target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-luxury-charcoal underline underline-offset-4">WhatsApp 7338546697</a></div>
    </div>
    <div className="border-t border-luxury-border px-6 py-5 text-center text-[10px] tracking-wide text-luxury-gray">© {new Date().getFullYear()} GOSH</div>
  </footer>;
}
