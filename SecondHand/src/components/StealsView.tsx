import React, { useState, useMemo } from 'react';
import { ViewState, Product } from '../types';
import { products } from '../data';
import { motion } from 'motion/react';
import { Heart, ArrowDownRight } from 'lucide-react';
import { formatINR } from '../utils/currency';

interface StealsViewProps {
  setView: (view: ViewState) => void;
  setSelectedProduct: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  wishlist: Product[];
}

export default function StealsView({
  setView,
  setSelectedProduct,
  onToggleWishlist,
  wishlist
}: StealsViewProps) {
  const [selectedSub, setSelectedSub] = useState<string>('All Steals');
  const [sortBy, setSortBy] = useState<string>('discount');

  const discountedProducts = useMemo(() => {
    return products.filter((p) => p.originalPrice !== undefined && p.discount !== undefined);
  }, []);

  const subs = ['All Steals', 'Outerwear', 'Tops & Blouses', 'Trousers'];

  const filteredAndSorted = useMemo(() => {
    let result = discountedProducts;

    if (selectedSub !== 'All Steals') {
      result = result.filter((p) => p.subcategory.toLowerCase() === selectedSub.toLowerCase());
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'price-low') {
        return a.price - b.price;
      }
      if (sortBy === 'price-high') {
        return b.price - a.price;
      }
      const distA = a.originalPrice ? ((a.originalPrice - a.price) / a.originalPrice) : 0;
      const distB = b.originalPrice ? ((b.originalPrice - b.price) / b.originalPrice) : 0;
      return distB - distA;
    });
  }, [discountedProducts, selectedSub, sortBy]);

  const isProductInWishlist = (id: string) => wishlist.some((item) => item.id === id);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView('detail');
  };

  return (
    <div className="bg-luxury-sand min-h-screen py-10 px-6 md:py-16 md:px-12">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="border-b border-luxury-border pb-8 mb-12 flex flex-col md:flex-row md:items-end md:justify-between space-y-6 md:space-y-0 text-left">
          <div>
            <div className="flex items-center space-x-2 text-luxury-gray mb-2 font-mono text-[9px] tracking-[0.3em] uppercase">
              <span>Exclusive Access</span>
            </div>
            <h2 className="font-serif text-3xl font-light tracking-tight text-luxury-charcoal uppercase md:text-4xl flex items-center">
              <span>Curated Steals</span>
              <ArrowDownRight className="h-6 w-6 ml-2 text-red-600" />
            </h2>
            <p className="font-sans text-xs text-luxury-gray mt-3 max-w-xl leading-relaxed">
              Limited-duration archival markdowns on rare historical pieces. Circular fashion means keeping rare designs in constant rotation instead of dark storage rooms.
            </p>
          </div>

          <div className="flex self-start md:self-auto items-center space-x-2 bg-red-50 text-red-700 text-xs tracking-wider px-4 py-2.5 rounded border border-red-200 font-mono uppercase font-semibold">
            <span>Up to 48% Immediate Reduction</span>
          </div>
        </div>

        {/* Categories Bar & Sort Controls */}
        <div className="flex flex-col justify-between items-stretch md:items-center md:flex-row border-b border-luxury-border pb-6 mb-10 space-y-4 md:space-y-0 text-left">
          <div className="flex flex-wrap gap-2">
            {subs.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedSub(tab)}
                className={`text-xs font-sans tracking-widest px-4 py-2 border rounded-full transition-all duration-300 uppercase ${
                  selectedSub === tab
                    ? 'border-luxury-charcoal bg-luxury-charcoal text-white font-semibold'
                    : 'border-luxury-border bg-white text-luxury-gray hover:border-luxury-charcoal hover:text-luxury-charcoal'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3 justify-end">
            <span className="font-mono text-[10px] tracking-wider text-luxury-gray uppercase">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-3 bg-transparent border border-luxury-border text-luxury-charcoal outline-none font-sans text-xs uppercase font-semibold rounded-sm hover:border-luxury-charcoal transition-colors cursor-pointer"
            >
              <option value="discount">Highest Discount Value</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filteredAndSorted.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSorted.map((product) => (
              <motion.div
                key={product.id}
                className="group relative flex flex-col"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="relative aspect-3/4 w-full overflow-hidden bg-gray-100 border border-luxury-border cursor-pointer">
                  <img
                    src={product.image}
                    alt={product.title}
                    onClick={() => handleProductClick(product)}
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-102"
                    referrerPolicy="no-referrer"
                  />

                  <div className="absolute top-4 left-4 bg-red-600 text-white font-mono text-xs font-bold px-3 py-1 flex items-center shadow-sm rounded-xs tracking-wider">
                    <span>{product.discount}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(product);
                    }}
                    className="absolute top-4 right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-luxury-sand/80 shadow backdrop-blur-xs transition-colors hover:bg-luxury-sand"
                    aria-label="Wishlist toggle"
                  >
                    <Heart
                      className={`h-4.5 w-4.5 transition-colors ${
                        isProductInWishlist(product.id) ? 'fill-red-600 text-red-600' : 'text-luxury-charcoal'
                      }`}
                    />
                  </button>
                </div>

                <div className="mt-5 flex flex-col flex-grow text-left justify-between">
                  <div onClick={() => handleProductClick(product)}>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-[9px] tracking-[0.25em] text-luxury-gray font-semibold uppercase">
                        {product.brand}
                      </p>
                      <span className="font-mono text-[8px] tracking-wider text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 uppercase">
                        Save {formatINR(product.originalPrice! - product.price)}
                      </span>
                    </div>
                    <h4 className="font-serif text-[16px] font-medium tracking-tight text-luxury-charcoal mt-2 group-hover:text-luxury-gray transition-colors leading-snug">
                      {product.title}
                    </h4>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-luxury-border flex items-center justify-between">
                    <span className="font-sans text-[10px] tracking-wider text-luxury-gray uppercase">
                      Condition • {product.condition}
                    </span>
                    <div className="flex space-x-3 items-baseline">
                      <span className="font-mono text-sm font-semibold text-red-600">
                        {formatINR(product.price)}
                      </span>
                      <span className="font-mono text-[11px] text-luxury-gray line-through">
                        {product.originalPrice ? formatINR(product.originalPrice) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-luxury-border text-center bg-white rounded-lg">
            <p className="font-serif italic text-lg text-luxury-charcoal">No steals found in this segment.</p>
            <p className="font-sans text-xs text-luxury-gray mt-2">Check back soon for vintage Burberry and Celine vaults.</p>
            <button
              onClick={() => setSelectedSub('All Steals')}
              className="bg-luxury-charcoal text-white font-semibold text-xs tracking-widest px-6 py-3.5 mt-6 uppercase hover:bg-[#2d392f] transition-all font-mono rounded-full"
            >
              Reset Category
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
