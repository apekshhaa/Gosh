import React, { useState, useMemo } from 'react';
import { ViewState, Product } from '../types';
import { products } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Grid, List, Sparkles } from 'lucide-react';
import { formatINR } from '../utils/currency';

interface NewArrivalsViewProps {
  setView: (view: ViewState) => void;
  setSelectedProduct: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  wishlist: Product[];
}

export default function NewArrivalsView({
  setView,
  setSelectedProduct,
  onToggleWishlist,
  wishlist
}: NewArrivalsViewProps) {
  const [limit, setLimit] = useState<number>(4);
  const [isGridView, setIsGridView] = useState<boolean>(true);

  // Filter products checking in completed archives (we can mock newest arrivals via custom sorting or IDs)
  const sortedByNewest = useMemo(() => {
    // Return all items but sort such that Burberry, Jil Sander, Studio Nicholson, Issey Miyake are first
    const items = [...products];
    return items.sort((a, b) => {
      if (a.id.includes('burberry') || a.id.includes('nicholson')) return -1;
      if (b.id.includes('burberry') || b.id.includes('nicholson')) return 1;
      return 0;
    });
  }, []);

  const visibleProducts = useMemo(() => {
    return sortedByNewest.slice(0, limit);
  }, [sortedByNewest, limit]);

  const isProductInWishlist = (id: string) => wishlist.some((item) => item.id === id);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView('detail');
  };

  return (
    <div className="bg-[#FCFCFA] min-h-screen py-10 px-6 md:py-20 md:px-16 text-[#1A1A1A]">
      <div className="mx-auto max-w-7xl">
        
        {/* Title area */}
        <div className="border-b border-[#EBEBE5] pb-10 mb-16 flex flex-col justify-between items-baseline md:flex-row space-y-6 md:space-y-0 text-left">
          <div>
            <div className="flex items-center text-[#7F7F72] space-x-2">
              <Sparkles className="h-4 w-4 text-[#8A8A7C]" />
              <span className="font-mono text-[9px] tracking-[0.35em] uppercase">EDITORIAL JUST-IN</span>
            </div>
            <h2 className="font-serif text-4xl font-extralight tracking-tight text-[#1C1C1C] uppercase md:text-5xl lg:text-6xl mt-4 leading-none">
              Freshly Curated <br/>
              <span className="font-serif italic font-normal text-[#8A8A7C] capitalize normal-case text-3xl md:text-4xl lg:text-5xl tracking-normal">New Releases</span>
            </h2>
            <p className="font-sans text-xs text-luxury-gray mt-4 max-w-md leading-relaxed">
              Pruned single-item archival collections registered within the past 48 hours. Carefully cataloged, authenticated, and ready to occupy their next chapter.
            </p>
          </div>

          {/* Grid view toggles */}
          <div className="flex items-center space-x-4">
            <span className="font-mono text-[9px] tracking-widest text-luxury-gray uppercase hidden sm:inline">VIEW LAYOUT:</span>
            <div className="flex items-center space-x-1 border border-[#EBEBE5] p-1 bg-white rounded-sm">
              <button
                onClick={() => setIsGridView(true)}
                className={`p-2 transition-all ${isGridView ? 'bg-[#1C1C1C] text-white' : 'text-luxury-gray hover:text-luxury-charcoal'}`}
                aria-label="Grid view"
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsGridView(false)}
                className={`p-2 transition-all ${!isGridView ? 'bg-[#1C1C1C] text-white' : 'text-luxury-gray hover:text-luxury-charcoal'}`}
                aria-label="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Display Layout */}
        <AnimatePresence mode="popLayout">
          {isGridView ? (
            /* Editorial Staggered Grid Presentation */
            <motion.div
              layout
              className="grid grid-cols-1 gap-x-12 gap-y-24 sm:grid-cols-2 lg:grid-cols-4 md:pb-24"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {visibleProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  layout
                  className={`group relative flex flex-col cursor-pointer transition-all duration-300 ${
                    idx % 2 === 1 ? 'md:mt-16 lg:mt-24' : ''
                  }`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.5 }}
                >
                  {/* Image container with elegant border and ratio */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F5F5F0] border border-[#EBEBE5] transition-all duration-500 group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
                    <img
                      src={product.image}
                      alt={product.title}
                      onClick={() => handleProductClick(product)}
                      className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      referrerPolicy="no-referrer"
                    />

                    {/* Wishlist toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(product);
                      }}
                      className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-xs transition-transform duration-300 hover:scale-110 active:scale-95"
                      aria-label="Wishlist toggle"
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${
                          isProductInWishlist(product.id) ? 'fill-red-600 text-red-600' : 'text-[#1C1C1C]'
                        }`}
                      />
                    </button>

                    {/* High end mono seal */}
                    <div className="absolute top-4 left-4 bg-[#1C1C1C] text-white font-mono text-[8px] tracking-[0.2em] px-2.5 py-1 uppercase rounded-xs">
                      Piece {idx + 1} // New
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col flex-grow text-left">
                    <div onClick={() => handleProductClick(product)} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[9px] tracking-[0.25em] text-[#8A8A7C] uppercase">
                          {product.brand}
                        </p>
                        <span className="font-mono text-[8px] text-gray-400">/ 0{idx+1}</span>
                      </div>
                      <h4 className="font-serif text-[15px] font-medium tracking-tight text-[#1C1C1C] leading-snug group-hover:text-[#8A8A7C] transition-colors">
                        {product.title}
                      </h4>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#EBEBE5] flex items-center justify-between font-mono text-xs text-[#1C1C1C]">
                      <span className="font-sans text-[10px] tracking-wide text-luxury-gray uppercase">
                        Size {product.size} • {product.condition}
                      </span>
                      <span className="font-bold tracking-tight">{formatINR(product.price)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            /* Editorial Elegant List Presentation */
            <motion.div
              layout
              className="space-y-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {visibleProducts.map((product, idx) => (
                <motion.div
                  key={product.id}
                  layout
                  className="flex flex-col md:flex-row items-stretch border-b border-[#EBEBE5] pb-8 pt-4 group cursor-pointer text-left"
                  onClick={() => handleProductClick(product)}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <div className="h-40 w-32 overflow-hidden bg-[#F5F5F0] border border-[#EBEBE5] flex-shrink-0 relative">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-104"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="mt-6 md:mt-0 md:ml-10 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-[9px] tracking-[0.25em] text-[#8A8A7C] uppercase">{product.brand}</span>
                        <span className="h-1 w-1 bg-[#8A8A7C] rounded-full" />
                        <span className="font-mono text-[8px] tracking-[0.2em] text-[#1C1C1C] uppercase font-bold bg-[#F3F3ED] px-2 py-0.5 border border-[#E4E4DB]">STRICTLY INDIVIDUAL</span>
                      </div>
                      <h4 className="font-serif text-xl font-medium tracking-tight text-[#1C1C1C] mt-2 group-hover:text-luxury-gray transition-colors">
                        {product.title}
                      </h4>
                      <p className="font-sans text-xs text-luxury-gray mt-2 max-w-2xl leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[10px] font-mono text-[#8A8A7C] uppercase border-t border-[#EBEBE5] pt-3 max-w-xl">
                      <span>Size: <strong className="text-[#1C1C1C] font-semibold">{product.size}</strong></span>
                      <span>Condition: <strong className="text-[#1C1C1C] font-semibold">{product.condition}</strong></span>
                      <span>Material: <strong className="text-[#1C1C1C] font-semibold">{product.material}</strong></span>
                    </div>
                  </div>

                  <div className="mt-6 md:mt-0 md:pl-8 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center flex-shrink-0 min-w-[120px]">
                    <span className="font-mono text-xl font-bold text-[#1C1C1C] order-1 md:order-none">
                      {formatINR(product.price)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWishlist(product);
                      }}
                      className="text-luxury-gray hover:text-red-600 p-2.5 border border-[#EBEBE5] rounded-full hover:bg-white transition-colors order-none md:order-1 md:mt-4 hover:scale-105 active:scale-95"
                      aria-label="Wishlist toggle"
                    >
                      <Heart className={`h-4 w-4 ${isProductInWishlist(product.id) ? 'fill-red-600 text-red-600' : ''}`} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More Archives Button */}
        {sortedByNewest.length > limit && (
          <div className="flex justify-center mt-12 md:mt-20">
            <button
              id="load-more-arrivals"
              onClick={() => setLimit((l) => l + 4)}
              className="group flex items-center space-x-3 border border-black bg-transparent px-8 py-4 text-xs font-semibold tracking-widest text-black uppercase transition-all duration-300 hover:bg-black hover:text-white"
            >
              <span>Load More Archives</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
