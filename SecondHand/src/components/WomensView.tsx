import React, { useState, useMemo } from 'react';
import { ViewState, Product } from '../types';
import { products } from '../data';
import { motion } from 'motion/react';
import { Heart, Check, Plus } from 'lucide-react';
import { formatINR } from '../utils/currency';

interface WomensViewProps {
  setView: (view: ViewState) => void;
  setSelectedProduct: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  wishlist: Product[];
}

export default function WomensView({
  setView,
  setSelectedProduct,
  onToggleWishlist,
  wishlist
}: WomensViewProps) {
  const [selectedMain, setSelectedMain] = useState<string>('women');
  const [selectedSub, setSelectedSub] = useState<string>('All Women');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [limit, setLimit] = useState<number>(4); // Default to show 4, expand with "Load More Items"

  const mainCategories = [
    { id: 'women', name: "Women's Wear", allSelectLabel: 'All Women', description: "A meticulous assembly of foundational women's architectural garments structured from sandwashed silk, fine-spun Italian knitwear, and GOTS-certified cotton fabrics." },
    { id: 'men', name: "Men's Wear", allSelectLabel: 'All Men', description: "Finely constructed tailoring, vintage Italian outerwear, and structured cotton shirting representing pure craftsmanship and functional nobility." },
    { id: 'children', name: "Children's Wear", allSelectLabel: 'All Children', description: "Delicate, hand-knitted merino wools and miniature heritage outerwear crafted to provide supreme comfort and circular preservation." },
    { id: 'accessories', name: "Accessories", allSelectLabel: 'All Accessories', description: "Preserved leatherwork, hand-rolled Carré silk scarves, and vegetable-tanned footwear sourced with single-item precision." }
  ];

  const subcategoriesMap: Record<string, string[]> = {
    women: ['All Women', 'Dresses', 'Tops & Blouses', 'Outerwear', 'Knitwear', 'Trousers'],
    men: ['All Men', 'Suits & Blazers', 'Shirts', 'Outerwear', 'Knitwear', 'Trousers', 'Footwear'],
    children: ['All Children', 'Outerwear', 'Knitwear'],
    accessories: ['All Accessories', 'Bags', 'Footwear', 'Scarves']
  };

  const subcategories = subcategoriesMap[selectedMain] || ['All'];
  const sizes = ['XS', 'S', 'M', 'L'];
  const conditions = ['Pristine', 'Excellent', 'Very Good'];

  const handleSizeToggle = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
    setLimit(4);
  };

  const handleConditionToggle = (condition: string) => {
    setSelectedConditions((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    );
    setLimit(4);
  };

  const filteredWomensProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Sector level filter
      if (selectedMain === 'women') {
        const isWomenItem = product.category === 'womens' || product.category === 'outerwear' || product.category === 'knitwear';
        const isExcludedMensOnly = product.id === 'vintage-armani-blazer' || product.id === 'hermes-silk-shirt';
        if (!isWomenItem || isExcludedMensOnly) return false;
      } else if (selectedMain === 'men') {
        const isMenItem = product.category === 'mens' || product.id === 'vintage-burberry-overcoat' || product.id === 'structured-olive-trench' || product.id === 'churchs-loafers' || product.id === 'loropiana-cashmere-knit';
        if (!isMenItem) return false;
      } else if (selectedMain === 'children') {
        if (product.category !== 'children') return false;
      } else if (selectedMain === 'accessories') {
        if (product.category !== 'accessories') return false;
      }

      // 2. Subcategory Match
      const currentLabel = mainCategories.find(c => c.id === selectedMain)?.allSelectLabel;
      if (selectedSub !== currentLabel) {
        if (product.subcategory.toLowerCase() !== selectedSub.toLowerCase()) {
          return false;
        }
      }

      // 3. Size Match
      if (selectedSizes.length > 0 && !selectedSizes.includes(product.size)) {
        return false;
      }

      // 4. Condition Match
      if (selectedConditions.length > 0 && !selectedConditions.includes(product.condition)) {
        return false;
      }

      return true;
    });
  }, [selectedMain, selectedSub, selectedSizes, selectedConditions]);

  const displayedProducts = useMemo(() => {
    return filteredWomensProducts.slice(0, limit);
  }, [filteredWomensProducts, limit]);

  const isProductInWishlist = (id: string) => wishlist.some((item) => item.id === id);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView('detail');
  };

  return (
    <div className="bg-luxury-sand min-h-screen py-10 px-6 md:py-16 md:px-12">
      <div className="mx-auto max-w-7xl">
        
        {/* Underlined Header Title */}
        <div className="border-b border-luxury-border pb-6 mb-8 text-left">
          <p className="font-mono text-[9px] tracking-[0.25em] text-luxury-gray uppercase mb-1">
            Archival Indexes
          </p>
          <h2 className="font-serif text-3xl font-light tracking-tight text-luxury-charcoal uppercase md:text-4xl">
            {mainCategories.find(c => c.id === selectedMain)?.name}
          </h2>
          <p className="font-sans text-xs text-luxury-gray mt-2 max-w-xl">
            {mainCategories.find(c => c.id === selectedMain)?.description}
          </p>
        </div>

        {/* Sector Tabs Navigation */}
        <div className="flex flex-wrap gap-3 mb-12 border-b border-luxury-border/40 pb-6 justify-start w-full">
          {mainCategories.map((cat) => (
            <button
              id={`cat-main-${cat.id}`}
              key={cat.id}
              onClick={() => {
                setSelectedMain(cat.id);
                setSelectedSub(cat.allSelectLabel);
                setLimit(4);
              }}
              className={`px-5 py-2.5 font-sans font-semibold text-[11px] tracking-widest uppercase border transition-all cursor-pointer rounded-full ${
                selectedMain === cat.id
                  ? 'bg-luxury-charcoal text-white border-luxury-charcoal shadow-sm'
                  : 'bg-white text-luxury-gray border-[#eae7e7] hover:text-luxury-charcoal hover:border-luxury-gray'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* Subcategories sidebar (Left) */}
          <aside className="lg:col-span-3 space-y-8">
            <div>
              <h4 className="font-mono text-[10px] font-semibold tracking-widest text-[#1C1C1C] uppercase mb-4 border-b border-luxury-border pb-2">
                Sub-Categories
              </h4>
              <ul className="space-y-3">
                {subcategories.map((sub) => (
                  <li key={sub}>
                    <button
                      onClick={() => {
                        setSelectedSub(sub);
                        setLimit(4);
                      }}
                      className={`text-left font-sans text-sm tracking-wide transition-colors uppercase w-full flex items-center justify-between ${
                        selectedSub === sub
                          ? 'text-[#1C1C1C] font-semibold'
                          : 'text-luxury-gray hover:text-[#1C1C1C]'
                      }`}
                    >
                      <span>{sub}</span>
                      {selectedSub === sub && <span className="h-1.5 w-1.5 rounded-full bg-luxury-charcoal" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Custom Sizes */}
            <div>
              <h4 className="font-mono text-[10px] font-semibold tracking-widest text-[#1C1C1C] uppercase mb-4 border-b border-luxury-border pb-2">
                Size Range
              </h4>
              <div className="flex flex-wrap gap-2">
                {sizes.map((sz) => {
                  const isActive = selectedSizes.includes(sz);
                  return (
                    <button
                      id={`womens-size-${sz}`}
                      key={sz}
                      onClick={() => handleSizeToggle(sz)}
                      className={`flex h-9 w-9 items-center justify-center font-mono text-[11px] border tracking-wider transition-colors ${
                        isActive
                          ? 'bg-[#1C1C1C] text-white border-[#1C1C1C]'
                          : 'border-luxury-border text-[#1C1C1C] hover:border-[#1C1C1C]'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Item Condition */}
            <div>
              <h4 className="font-mono text-[10px] font-semibold tracking-widest text-[#1C1C1C] uppercase mb-4 border-b border-luxury-border pb-2">
                Preservation Rating
              </h4>
              <div className="space-y-3">
                {conditions.map((cond) => {
                  const isActive = selectedConditions.includes(cond);
                  return (
                    <button
                      id={`womens-cond-${cond}`}
                      key={cond}
                      onClick={() => handleConditionToggle(cond)}
                      className="flex items-center text-left space-x-3 group w-full"
                    >
                      <div className={`mt-0.5 flex h-4.5 w-4.5 items-center justify-center border transition-colors ${
                        isActive ? 'bg-[#1C1C1C] border-[#1C1C1C] text-white' : 'border-luxury-border group-hover:border-luxury-charcoal'
                      }`}>
                        {isActive && <Check className="h-3 w-3" />}
                      </div>
                      <span className={`font-sans text-[13px] tracking-wide ${isActive ? 'text-[#1C1C1C] font-semibold' : 'text-luxury-gray group-hover:text-luxury-charcoal'}`}>
                        {cond}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Product list grid (Right) */}
          <main className="lg:col-span-9 flex flex-col justify-between">
            {displayedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2">
                  {displayedProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      className="group relative flex flex-col cursor-pointer"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {/* Image Area */}
                      <div className="relative aspect-3/4 w-full overflow-hidden bg-gray-100 border border-luxury-border">
                        <img
                          src={product.image}
                          alt={product.title}
                          onClick={() => handleProductClick(product)}
                          className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-102"
                          referrerPolicy="no-referrer"
                        />

                        {/* Heart Wishlist Overlay */}
                        <button
                          onClick={() => onToggleWishlist(product)}
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

                      {/* Info Area */}
                      <div className="mt-4 flex flex-col flex-grow justify-between">
                        <div onClick={() => handleProductClick(product)}>
                          <div className="flex items-center justify-between">
                            <p className="font-mono text-[10px] tracking-widest text-luxury-gray uppercase">
                              {product.brand}
                            </p>
                            <span className="font-mono text-[9px] tracking-wider text-luxury-charcoal bg-luxury-border/30 border border-luxury-border px-1.5 py-0.5 rounded">
                              SKU • {product.id.substring(0, 5).toUpperCase()}
                            </span>
                          </div>
                          <h4 className="font-serif text-base font-medium tracking-tight text-luxury-charcoal mt-1 group-hover:underline">
                            {product.title}
                          </h4>
                          <p className="font-sans text-xs text-luxury-gray truncate mt-1 leading-relaxed">
                            {product.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-luxury-border/40 flex items-center justify-between">
                          <span className="font-sans text-[11px] text-gray-500 uppercase">
                            Size {product.size} • {product.material.split(' ')[1] || 'Fabric'}
                          </span>
                          <span className="font-mono text-sm text-[#1C1C1C] font-semibold">
                            {formatINR(product.price)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Load More Archives Button */}
                {filteredWomensProducts.length > limit && (
                  <div className="flex justify-center mt-16">
                    <button
                      id="load-more-womens"
                      onClick={() => setLimit((l) => l + 4)}
                      className="group flex items-center space-x-3 border border-luxury-charcoal bg-transparent px-8 py-4 text-xs font-semibold tracking-widest text-[#1C1C1C] uppercase transition-all duration-300 hover:bg-[#1C1C1C] hover:text-white"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Load More Items</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-luxury-border text-center bg-luxury-border/10">
                <p className="font-serif italic text-lg text-luxury-charcoal">No {selectedMain} items found in this section.</p>
                <p className="font-sans text-xs text-luxury-gray mt-2">Adjust your custom size filters or subcategories to explore.</p>
                <button
                  onClick={() => {
                    const currentDefault = mainCategories.find(c => c.id === selectedMain)?.allSelectLabel || 'All';
                    setSelectedSub(currentDefault);
                    setSelectedSizes([]);
                    setSelectedConditions([]);
                  }}
                  className="bg-[#1C1C1C] text-white font-semibold text-xs tracking-widest px-6 py-3 mt-6 uppercase hover:bg-opacity-90"
                >
                  Reset Selection
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
