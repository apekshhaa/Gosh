import React, { useEffect, useState } from 'react';
import { ViewState } from '../types';
import { Search, Menu, X, ArrowRight, Heart, ShoppingBag, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import BrandTagline from './BrandTagline';

interface HeaderProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  cartCount: number;
  wishlistCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Header({ currentView, setView, onSearch, searchQuery, cartCount, wishlistCount, theme, onToggleTheme }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState(searchQuery);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => setSearchVal(searchQuery), [searchQuery]);
  useEffect(() => {
    if (!isMobileMenuOpen && !isSearchOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setIsMobileMenuOpen(false); setIsSearchOpen(false); }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isMobileMenuOpen, isSearchOpen]);

  const go = (view: ViewState) => {
    setView(view);
    setIsMobileMenuOpen(false);
  };
  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch(searchVal.trim());
    setIsSearchOpen(false);
  };

  return <>
    <header className="sticky top-0 z-40 w-full border-b border-luxury-border bg-luxury-sand/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 md:px-12">
        <div className="grid min-h-20 grid-cols-[1fr_auto_1fr] items-center py-2">
          <div className="flex items-center gap-1">
            <button onClick={() => setIsMobileMenuOpen(true)} className="inline-flex h-11 w-11 items-center justify-center md:hidden" aria-label="Open navigation menu" aria-expanded={isMobileMenuOpen}>
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.16em] text-luxury-gray md:block">Pre-loved · Free shipping over ₹900</span>
          </div>
          <button onClick={() => go('home')} className="flex flex-col items-center gap-1.5 text-center" aria-label="GOSH home">
            <span className="font-serif text-2xl font-semibold tracking-[0.15em] md:text-3xl">GOSH</span><BrandTagline />
          </button>
          <div className="flex justify-end gap-0.5 sm:gap-1">
            <button onClick={() => setIsSearchOpen((open) => !open)} className="inline-flex h-11 w-11 items-center justify-center text-luxury-gray hover:text-luxury-charcoal" aria-label={isSearchOpen ? 'Close search' : 'Search items'} aria-expanded={isSearchOpen}><Search className="h-5 w-5" /></button>
            <button onClick={() => go('wishlist')} className="relative hidden h-11 w-11 items-center justify-center text-luxury-gray hover:text-luxury-charcoal sm:inline-flex" aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ''}`}><Heart className="h-5 w-5" />{wishlistCount > 0 && <span className="absolute right-0 top-0 min-w-4 rounded-full bg-luxury-charcoal px-1 text-[9px] leading-4 text-white">{wishlistCount}</span>}</button>
            <button onClick={() => go('cart')} className="relative inline-flex h-11 w-11 items-center justify-center text-luxury-gray hover:text-luxury-charcoal" aria-label={`Shopping bag${cartCount ? `, ${cartCount} items` : ''}`}><ShoppingBag className="h-5 w-5" />{cartCount > 0 && <span className="absolute right-0 top-0 min-w-4 rounded-full bg-luxury-charcoal px-1 text-[9px] leading-4 text-white">{cartCount}</span>}</button>
            <button onClick={onToggleTheme} className="inline-flex h-11 w-11 items-center justify-center text-luxury-gray hover:text-luxury-charcoal" aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>{theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}</button>
          </div>
        </div>
        <nav aria-label="Main navigation" className="hidden justify-center gap-8 border-t border-luxury-border/40 py-3 md:flex">
          <button onClick={() => go('shop')} aria-current={currentView === 'shop' ? 'page' : undefined} className={`min-h-8 text-[11px] font-semibold uppercase tracking-[0.15em] ${currentView === 'shop' ? 'text-luxury-charcoal underline underline-offset-4' : 'text-luxury-gray'}`}>Shop all</button>
          <button onClick={() => go('womens')} aria-current={currentView === 'womens' ? 'page' : undefined} className={`min-h-8 text-[11px] font-semibold uppercase tracking-[0.15em] ${currentView === 'womens' ? 'text-luxury-charcoal underline underline-offset-4' : 'text-luxury-gray'}`}>Women</button>
          <button onClick={() => go('about')} aria-current={currentView === 'about' ? 'page' : undefined} className={`min-h-8 text-[11px] font-semibold uppercase tracking-[0.15em] ${currentView === 'about' ? 'text-luxury-charcoal underline underline-offset-4' : 'text-luxury-gray'}`}>About GOSH</button>
          <button onClick={() => go('wishlist')} aria-current={currentView === 'wishlist' ? 'page' : undefined} className="min-h-8 text-[11px] font-semibold uppercase tracking-[0.15em] text-luxury-gray">Wishlist</button>
        </nav>
      </div>
    </header>

    <AnimatePresence>
      {isSearchOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-luxury-border bg-luxury-sand">
        <form onSubmit={submitSearch} role="search" className="mx-auto max-w-2xl px-6 py-4">
          <label htmlFor="site-search" className="sr-only">Search by item, category, colour, brand, or size</label>
          <div className="flex min-h-11 items-center border-b border-luxury-charcoal pb-2">
            <input id="site-search" type="search" placeholder="Search items, colours, brands, sizes…" value={searchVal} onChange={(event) => setSearchVal(event.target.value)} className="w-full bg-transparent text-sm tracking-wide outline-none" autoFocus />
            <button type="submit" className="inline-flex h-11 w-11 items-center justify-center" aria-label="Submit search"><ArrowRight className="h-5 w-5" /></button>
          </div>
        </form>
      </motion.div>}
    </AnimatePresence>

    <AnimatePresence>
      {isMobileMenuOpen && <>
        <motion.button aria-label="Close navigation menu" className="fixed inset-0 z-40 bg-black/40 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} />
        <motion.aside role="dialog" aria-modal="true" aria-label="Navigation menu" className="fixed inset-y-0 left-0 z-50 w-[min(85vw,22rem)] overflow-y-auto bg-luxury-sand p-6 shadow-2xl md:hidden" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}>
          <div className="flex items-center justify-between border-b border-luxury-border pb-4"><h2 className="font-serif text-xl">GOSH</h2><button onClick={() => setIsMobileMenuOpen(false)} className="inline-flex h-11 w-11 items-center justify-center" aria-label="Close menu"><X className="h-5 w-5" /></button></div>
          <nav aria-label="Mobile navigation" className="mt-4 flex flex-col divide-y divide-luxury-border">
            {([['home', 'Home'], ['shop', 'Shop all'], ['womens', 'Women'], ['wishlist', `Wishlist (${wishlistCount})`], ['cart', `Shopping bag (${cartCount})`], ['about', 'About GOSH']] as [ViewState, string][]).map(([view, label]) => <button key={view} onClick={() => go(view)} className="min-h-12 py-3 text-left text-sm uppercase tracking-wider">{label}<ArrowRight className="float-right h-4 w-4" /></button>)}
          </nav>
        </motion.aside>
      </>}
    </AnimatePresence>
  </>;
}
