import React from 'react';
import { ViewState, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, ShoppingBag, Heart, ArrowRight } from 'lucide-react';
import { formatINR } from '../utils/currency';

interface WishlistViewProps {
  wishlist: Product[];
  setView: (view: ViewState) => void;
  setSelectedProduct: (product: Product) => void;
  onRemoveFromWishlist: (product: Product) => void;
  onMoveToBag: (product: Product) => void;
}

export default function WishlistView({
  wishlist,
  setView,
  setSelectedProduct,
  onRemoveFromWishlist,
  onMoveToBag
}: WishlistViewProps) {
  
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView('detail');
  };

  return (
    <div className="bg-luxury-sand min-h-screen py-10 px-6 md:py-16 md:px-12">
      <div className="mx-auto max-w-7xl">
        
        {/* Underlined Header Title */}
        <div className="border-b border-luxury-border pb-6 mb-12 flex justify-between items-end">
          <div className="text-left">
            <h2 className="font-serif text-3xl font-light tracking-tight text-luxury-charcoal uppercase md:text-4xl">
              Curated Wishlist
            </h2>
            <p className="font-sans text-xs text-luxury-gray mt-2 max-w-md">
              A private digital registry of single-piece archive items held specifically for your consideration.
            </p>
          </div>
          <span className="font-mono text-xs text-luxury-gray uppercase">
            {wishlist.length} {wishlist.length === 1 ? 'Item Saving' : 'Items Saved'}
          </span>
        </div>

        {/* Wishlist Items List layout */}
        <AnimatePresence mode="popLayout">
          {wishlist.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {wishlist.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="group relative flex flex-col border border-luxury-border bg-[#FBFBFA]"
                >
                  {/* Image canvas */}
                  <div className="relative aspect-3/4 overflow-hidden bg-gray-100 border-b border-luxury-border">
                    <img
                      src={product.image}
                      alt={product.title}
                      onClick={() => handleProductClick(product)}
                      className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-102 cursor-pointer"
                      referrerPolicy="no-referrer"
                    />

                    {/* Quick Absolute Remove button */}
                    <button
                      onClick={() => onRemoveFromWishlist(product)}
                      className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-luxury-sand/80 shadow backdrop-blur-xs transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  {/* Metadata & Actions */}
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[10px] tracking-widest text-luxury-gray uppercase">
                          {product.brand}
                        </p>
                        <span className="font-mono text-[9px] tracking-wider text-luxury-charcoal bg-luxury-sand px-1.5 py-0.5 border border-luxury-border">
                          Condition: {product.condition}
                        </span>
                      </div>
                      
                      <h4
                        onClick={() => handleProductClick(product)}
                        className="font-serif text-base font-semibold tracking-tight text-luxury-charcoal mt-1 group-hover:underline cursor-pointer text-left"
                      >
                        {product.title}
                      </h4>

                      <div className="flex items-center justify-between mt-3 text-xs font-sans text-luxury-gray">
                        <span>Fitted size: <strong className="text-luxury-charcoal font-semibold">{product.size}</strong></span>
                        <span className="font-mono text-sm text-luxury-charcoal font-semibold">{formatINR(product.price)}</span>
                      </div>
                    </div>

                    {/* Quick moves to bag action button */}
                    <div className="mt-6 pt-4 border-t border-luxury-border/60 flex items-center justify-between gap-3">
                      <button
                        onClick={() => onRemoveFromWishlist(product)}
                        className="flex-1 font-mono text-[10px] tracking-widest text-luxury-gray hover:text-red-600 transition-colors uppercase border border-luxury-border py-2.5 bg-white font-medium"
                      >
                        Remove
                      </button>
                      <button
                        id={`move-to-bag-${product.id}`}
                        onClick={() => onMoveToBag(product)}
                        className="flex-1 flex items-center justify-center space-x-1.5 bg-luxury-charcoal font-semibold text-[10px] tracking-widest text-[#FAF9F6] py-2.5 uppercase hover:bg-opacity-95 transition-all"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>Move to Bag</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-luxury-border text-center bg-luxury-border/10 max-w-lg mx-auto rounded"
            >
              <Heart className="h-10 w-10 text-luxury-gray mb-4 animate-pulse" />
              <p className="font-serif italic text-lg text-luxury-charcoal">Your curated wishlist layout is empty.</p>
              <p className="font-sans text-xs text-luxury-gray mt-2 max-w-xs">
                Browse our fresh sustainable arrivals or the comprehensive collection to bookmark unique historical releases.
              </p>
              <button
                onClick={() => setView('shop')}
                className="group flex items-center space-x-3 bg-luxury-charcoal font-semibold text-xs tracking-widest text-[#FAF9F6] px-8 py-3.5 mt-8 uppercase hover:bg-opacity-90 transition-all"
              >
                <span>Discover Collections</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
