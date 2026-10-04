import React, { useState } from 'react';
import { ViewState, Product } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import ShopView from './components/ShopView';
import ProductDetailView from './components/ProductDetailView';
import { products } from './data';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentView, setView] = useState<ViewState>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product>(products[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [shopCategory, setShopCategory] = useState('All');

  return (
    <div className="flex min-h-screen flex-col bg-luxury-sand text-luxury-charcoal selection:bg-luxury-charcoal selection:text-white">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-[#57443b] px-4 py-2 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-white">
        <span>Shipping charged separately · Free shipping on orders over ₹900</span>
        <span aria-hidden="true">·</span>
        <a href="https://wa.me/917338546697" target="_blank" rel="noreferrer" className="underline underline-offset-2">WhatsApp 7338546697</a>
      </div>
      <Header currentView={currentView} setView={setView} onSearch={setSearchQuery} />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div key={currentView} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}>
            {currentView === 'home' && <HomeView
              setView={setView}
              setSelectedProduct={setSelectedProduct}
              onSelectCategory={(category) => { setShopCategory(category); setView('shop'); }}
            />}
            {currentView === 'shop' && <ShopView
              setView={setView}
              setSelectedProduct={setSelectedProduct}
              initialSearchQuery={searchQuery}
              initialCategory={shopCategory}
              clearSearchQuery={() => setSearchQuery('')}
            />}
            {currentView === 'detail' && <ProductDetailView
              product={selectedProduct}
              setView={setView}
              setSelectedProduct={setSelectedProduct}
            />}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer setView={setView} />
    </div>
  );
}
