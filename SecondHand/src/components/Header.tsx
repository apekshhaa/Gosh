import React, { useState } from 'react';
import { ViewState } from '../types';
import { Search, Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BrandTagline from './BrandTagline';

interface HeaderProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onSearch: (query: string) => void;
}

export default function Header({ currentView, setView, onSearch }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch(searchVal);
    setView('shop');
    setIsSearchOpen(false);
  };

  return <>
    <header className="sticky top-0 z-40 w-full border-b border-luxury-border bg-luxury-sand/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid min-h-20 grid-cols-3 items-center py-3">
          <div className="flex items-center">
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 md:hidden" aria-label="Open menu"><Menu className="h-5 w-5"/></button>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-luxury-gray md:block">Pre-loved · free shipping over ₹900</span>
          </div>
          <button onClick={() => setView('home')} className="flex flex-col items-center gap-1.5 text-center">
            <span className="font-serif text-2xl font-semibold tracking-[0.15em] md:text-3xl">GOSH</span>
            <BrandTagline />
          </button>
          <div className="flex justify-end">
            <button onClick={() => setIsSearchOpen((open) => !open)} className="p-2 text-luxury-gray hover:text-luxury-charcoal" aria-label="Search items"><Search className="h-5 w-5"/></button>
          </div>
        </div>
        <nav className="hidden justify-center border-t border-luxury-border/40 py-3 md:flex">
          <button onClick={() => setView('shop')} className={`text-[11px] font-semibold uppercase tracking-[0.15em] ${currentView === 'shop' ? 'text-luxury-charcoal' : 'text-luxury-gray'}`}>View all items</button>
        </nav>
      </div>
    </header>

    <AnimatePresence>
      {isSearchOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-luxury-border bg-luxury-sand">
        <form onSubmit={submitSearch} className="mx-auto max-w-2xl px-6 py-5">
          <div className="flex items-center border-b border-luxury-charcoal pb-2">
            <input type="search" placeholder="Search skirts, tops and dresses..." value={searchVal} onChange={(event) => setSearchVal(event.target.value)} className="w-full bg-transparent text-sm tracking-wide outline-none" autoFocus/>
            <button type="submit" aria-label="Submit search"><ArrowRight className="h-5 w-5"/></button>
          </div>
        </form>
      </motion.div>}
    </AnimatePresence>

    <AnimatePresence>
      {isMobileMenuOpen && <>
        <motion.button aria-label="Close menu" className="fixed inset-0 z-40 bg-black/40 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)}/>
        <motion.aside className="fixed inset-y-0 left-0 z-50 w-4/5 max-w-sm bg-luxury-sand p-7 shadow-2xl md:hidden" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
          <div className="flex items-center justify-between border-b border-luxury-border pb-6"><h2 className="font-serif text-xl">GOSH</h2><button onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu"><X className="h-5 w-5"/></button></div>
          <button onClick={() => { setView('shop'); setIsMobileMenuOpen(false); }} className="mt-7 flex w-full items-center justify-between py-2 text-sm uppercase tracking-wider">View all items <ArrowRight className="h-4 w-4"/></button>
        </motion.aside>
      </>}
    </AnimatePresence>
  </>;
}
