import React, { useState, useMemo, useEffect } from 'react';
import { ViewState, Product } from '../types';
import { products } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal, ChevronDown, Check, X, Heart } from 'lucide-react';
import { formatINR } from '../utils/currency';

interface ShopViewProps {
  setView: (view: ViewState) => void;
  setSelectedProduct: (product: Product) => void;
  initialSearchQuery: string;
  initialCategory?: string;
  clearSearchQuery: () => void;
  wishlist: Product[];
  onToggleWishlist: (product: Product) => void;
}

export default function ShopView({
  setView,
  setSelectedProduct,
  initialSearchQuery,
  initialCategory = 'All',
  clearSearchQuery,
  wishlist,
  onToggleWishlist
}: ShopViewProps) {
  const savedState = useMemo(() => {
    try { return JSON.parse(window.sessionStorage.getItem('gosh-shop-filters') || '{}') as { category?: string; sizes?: string[]; conditions?: string[]; brand?: string; sortBy?: string; minPrice?: number | ''; maxPrice?: number | '' }; }
    catch { return {}; }
  }, []);
  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory !== 'All' ? initialCategory : savedState.category || 'All');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(savedState.sizes || []);
  const [selectedConditions, setSelectedConditions] = useState<string[]>(savedState.conditions || []);
  const [selectedBrand, setSelectedBrand] = useState(savedState.brand || '');
  const [minPrice, setMinPrice] = useState<number | ''>(savedState.minPrice ?? '');
  const [maxPrice, setMaxPrice] = useState<number | ''>(savedState.maxPrice ?? '');
  const [sortBy, setSortBy] = useState<string>(savedState.sortBy || 'newest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  const categories = ['All', 'Skirts', 'Tops', 'Dresses', 'Jeans', 'Trousers', 'Men'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', '28', '30', '32', '34'];
  const conditions = ['Pristine', 'Excellent', 'Very Good'];
  const brands = Array.from(new Set(products.map((product) => product.brand))).sort();

  useEffect(() => {
    try { window.sessionStorage.setItem('gosh-shop-filters', JSON.stringify({ category: selectedCategory, sizes: selectedSizes, conditions: selectedConditions, brand: selectedBrand, minPrice, maxPrice, sortBy })); }
    catch { /* Session storage may be unavailable. */ }
  }, [selectedCategory, selectedSizes, selectedConditions, selectedBrand, minPrice, maxPrice, sortBy]);
  useEffect(() => {
    if (!showMobileFilters) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setShowMobileFilters(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showMobileFilters]);
  useEffect(() => setCurrentPage(1), [initialSearchQuery]);

  // Toggle helpers
  const handleSizeToggle = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
    setCurrentPage(1);
  };

  const handleConditionToggle = (condition: string) => {
    setSelectedConditions((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    );
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setSelectedCategory('All');
    setSelectedSizes([]);
    setSelectedConditions([]);
    setSelectedBrand('');
    setMinPrice('');
    setMaxPrice('');
    clearSearchQuery();
    setCurrentPage(1);
  };

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Category Match
      if (selectedCategory !== 'All') {
        const normalizedCategory = selectedCategory.toLowerCase() === 'men' ? 'mens' : selectedCategory.toLowerCase();
        const matchesCategory =
          product.category.toLowerCase() === normalizedCategory ||
          product.subcategory.toLowerCase() === selectedCategory.toLowerCase();
        if (!matchesCategory) return false;
      }

      // Size Match
      if (selectedSizes.length > 0 && !selectedSizes.includes(product.filterSize || product.size)) {
        return false;
      }

      // Condition Match
      if (selectedConditions.length > 0 && !selectedConditions.includes(product.condition)) {
        return false;
      }
      if (selectedBrand && product.brand !== selectedBrand) return false;

      if (minPrice !== '' && (!product.price || product.price < minPrice)) return false;
      if (maxPrice !== '' && (!product.price || product.price > maxPrice)) return false;

      // Search Query Match
      if (initialSearchQuery) {
        const query = initialSearchQuery.toLowerCase();
        const matchesSearch =
          product.title.toLowerCase().includes(query) ||
          product.brand.toLowerCase().includes(query) ||
          product.subcategory.toLowerCase().includes(query) ||
          (product.sizeLabel || product.size).toLowerCase().includes(query) ||
          product.material.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      return true;
    }).sort((a, b) => {
      // Sorting
      if (sortBy === 'newest') {
        return products.indexOf(b) - products.indexOf(a);
      }
      if (sortBy === 'price-low') {
        return a.price - b.price;
      }
      if (sortBy === 'price-high') {
        return b.price - a.price;
      }
      // 'recommended' is default ordering
      return 0;
    });
  }, [selectedCategory, selectedSizes, selectedConditions, selectedBrand, minPrice, maxPrice, sortBy, initialSearchQuery]);

  // Pagination Constants (Show 6 products per page for high luxury presentation)
  const itemsPerPage = 6;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView('detail');
  };

  const activeFilterChips: Array<{ key: string; label: string; onRemove: () => void }> = [];
  if (selectedCategory !== 'All') activeFilterChips.push({ key: 'category', label: selectedCategory, onRemove: () => setSelectedCategory('All') });
  selectedSizes.forEach((size) => activeFilterChips.push({ key: `size-${size}`, label: `Size ${size}`, onRemove: () => setSelectedSizes((values) => values.filter((value) => value !== size)) }));
  selectedConditions.forEach((condition) => activeFilterChips.push({ key: `condition-${condition}`, label: condition, onRemove: () => setSelectedConditions((values) => values.filter((value) => value !== condition)) }));
  if (selectedBrand) activeFilterChips.push({ key: 'brand', label: selectedBrand, onRemove: () => setSelectedBrand('') });
  if (minPrice !== '') activeFilterChips.push({ key: 'min-price', label: `From ₹${minPrice}`, onRemove: () => setMinPrice('') });
  if (maxPrice !== '') activeFilterChips.push({ key: 'max-price', label: `Up to ₹${maxPrice}`, onRemove: () => setMaxPrice('') });
  if (initialSearchQuery) activeFilterChips.push({ key: 'query', label: `Search: ${initialSearchQuery}`, onRemove: clearSearchQuery });

  return (
    <div className="bg-luxury-sand min-h-screen py-10 px-6 md:py-16 md:px-12">
      <div className="mx-auto max-w-7xl">
        
        {/* Title area */}
        <div className="flex flex-col mb-10 border-b border-luxury-border pb-6 md:flex-row md:items-end md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="font-serif text-3xl font-light tracking-tight text-luxury-charcoal uppercase md:text-4xl">
              The Collection
            </h2>
            <p className="font-sans text-xs text-luxury-gray mt-2 max-w-lg leading-relaxed">
              A small, growing collection of pre-loved skirts, tops and dresses. Each listing shows its available size.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {initialSearchQuery && (
              <div className="flex items-center space-x-2 bg-luxury-border/30 border border-luxury-border px-3 py-1.5 rounded font-mono text-[11px] text-luxury-charcoal uppercase">
                <span>Search: "{initialSearchQuery}"</span>
                <button onClick={clearSearchQuery} aria-label="Clear Search">
                  <X className="h-3 w-3 hover:text-red-500" />
                </button>
              </div>
            )}
            <span className="font-mono text-[11px] text-luxury-gray uppercase">
              Showing {filteredProducts.length} Items
            </span>
          </div>
        </div>

        {/* Toolbar (Mobile Filter toggle & Sort Selector) */}
        <div className="flex items-center justify-between border-b border-luxury-border pb-4 mb-8">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center space-x-2 bg-transparent text-xs font-semibold tracking-widest text-luxury-charcoal uppercase border border-luxury-charcoal px-4 py-2 md:hidden"
          >
            <SlidersHorizontal className="h-4.5 w-4.5" />
            <span>Customize Filter</span>
          </button>

          <div className="hidden items-center space-x-2 md:flex">
            <SlidersHorizontal className="h-4 w-4 text-luxury-gray" />
            <span className="font-mono text-[10px] text-luxury-gray tracking-widest uppercase">
              FILTER & SORT MECHANISM
            </span>
          </div>

          {/* Sort dropdown */}
          <div className="relative flex items-center">
            <span className="font-sans text-xs text-luxury-gray mr-2 hidden md:inline">Sort by:</span>
            <div className="relative">
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-transparent py-1.5 pl-3 pr-8 font-sans text-xs font-semibold tracking-wider text-luxury-charcoal uppercase outline-none border border-luxury-border cursor-pointer hover:border-luxury-charcoal"
              >
                <option value="newest">Newest Vintage</option>
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-luxury-charcoal pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Desktop Layout Layout */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          {/* LEFT Sidebar - Desktop Filters */}
          <aside className="hidden lg:col-span-3 lg:block space-y-8">
            {/* Categories */}
            <div>
              <h4 className="font-mono text-[11px] font-semibold tracking-widest text-[#1C1C1C] uppercase mb-4 border-b border-luxury-border pb-2">
                Category Archive
              </h4>
              <ul className="space-y-2.5">
                {categories.map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => {
                        setSelectedCategory(cat);
                        setCurrentPage(1);
                      }}
                      className={`text-left font-sans text-[13px] tracking-wide transition-colors ${
                        selectedCategory === cat
                          ? 'text-[#1C1C1C] font-semibold'
                          : 'text-luxury-gray hover:text-[#1C1C1C]'
                      }`}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <label className="block font-mono text-[11px] font-semibold uppercase tracking-widest text-[#1C1C1C]">Brand
              <select value={selectedBrand} onChange={(event) => { setSelectedBrand(event.target.value); setCurrentPage(1); }} className="mt-3 min-h-11 w-full border border-luxury-border bg-transparent px-3 font-sans text-sm font-normal tracking-normal">
                <option value="">All brands</option>{brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
              </select>
            </label>

            {/* Custom Sizes */}
            <div>
              <h4 className="font-mono text-[11px] font-semibold tracking-widest text-[#1C1C1C] uppercase mb-4 border-b border-luxury-border pb-2">
                Filter by Size
              </h4>
              <div className="flex flex-wrap gap-2">
                {sizes.map((sz) => {
                  const isActive = selectedSizes.includes(sz);
                  return (
                    <button
                      id={`size-filter-${sz}`}
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

            <fieldset className="space-y-3">
              <legend className="font-mono text-[11px] font-semibold tracking-widest text-[#1C1C1C] uppercase border-b border-luxury-border pb-2 w-full">Price range (₹)</legend>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-luxury-gray">Minimum<input type="number" min="0" value={minPrice} onChange={(event) => { setMinPrice(event.target.value === '' ? '' : Number(event.target.value)); setCurrentPage(1); }} className="mt-1 min-h-10 w-full border border-luxury-border bg-transparent px-2 text-sm text-luxury-charcoal" /></label>
                <label className="text-[11px] text-luxury-gray">Maximum<input type="number" min="0" value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value === '' ? '' : Number(event.target.value)); setCurrentPage(1); }} className="mt-1 min-h-10 w-full border border-luxury-border bg-transparent px-2 text-sm text-luxury-charcoal" /></label>
              </div>
            </fieldset>

            {/* Item Condition */}
            <div>
              <h4 className="font-mono text-[11px] font-semibold tracking-widest text-[#1C1C1C] uppercase mb-4 border-b border-luxury-border pb-2">
                Product Condition
              </h4>
              <div className="space-y-3">
                {conditions.map((cond) => {
                  const isActive = selectedConditions.includes(cond);
                  return (
                    <button
                      id={`condition-filter-${cond}`}
                      key={cond}
                      onClick={() => handleConditionToggle(cond)}
                      className="flex items-center text-left space-x-3 group w-full"
                    >
                      <div className={`mt-0.5 flex h-4.5 w-4.5 items-center justify-center border transition-colors ${
                        isActive ? 'bg-[#1C1C1C] border-[#1C1C1C] text-white' : 'border-luxury-border group-hover:border-luxury-charcoal'
                      }`}>
                        {isActive && <Check className="h-3 w-3" />}
                      </div>
                      <span className={`font-sans text-[13px] tracking-wide ${isActive ? 'text-[#1C1C1C] font-medium' : 'text-luxury-gray group-hover:text-luxury-charcoal'}`}>
                        {cond}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Clear Filters Button */}
            {(selectedCategory !== 'All' || selectedSizes.length > 0 || selectedConditions.length > 0 || selectedBrand || minPrice !== '' || maxPrice !== '' || initialSearchQuery) && (
              <button
                onClick={resetAllFilters}
                className="w-full text-center font-mono text-[10px] tracking-widest text-red-600 border border-red-200 py-3 mt-6 hover:bg-red-50 transition-colors uppercase"
              >
                Clear Selected Filters
              </button>
            )}
          </aside>

          {/* RIGHT Side - Product Grid */}
          <main className="lg:col-span-9">
            <p className="mb-5 text-xs text-luxury-gray" aria-live="polite">{filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} found</p>
            {activeFilterChips.length > 0 && <div className="mb-5 flex flex-wrap gap-2" aria-label="Active filters">{activeFilterChips.map((chip) => <button key={chip.key} onClick={chip.onRemove} className="inline-flex min-h-9 items-center gap-2 border border-luxury-border px-3 text-xs text-luxury-charcoal hover:bg-luxury-border/20">{chip.label}<X className="h-3 w-3" /><span className="sr-only">Remove filter</span></button>)}</div>}
            {paginatedProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    className="group relative flex flex-col"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Image Area */}
                    <div className="relative aspect-3/4 w-full overflow-hidden bg-gray-100 border border-luxury-border cursor-pointer">
                      <img
                        src={product.image}
                        alt={product.title}
                        loading="lazy"
                        onClick={() => handleProductClick(product)}
                        className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-102"
                        referrerPolicy="no-referrer"
                      />
                      <button type="button" onClick={(event) => { event.stopPropagation(); onToggleWishlist(product); }} aria-label={wishlist.some((item) => item.id === product.id) ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`} aria-pressed={wishlist.some((item) => item.id === product.id)} className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-luxury-sand/90 text-luxury-charcoal shadow-sm">
                        <Heart className={`h-5 w-5 ${wishlist.some((item) => item.id === product.id) ? 'fill-current' : ''}`} />
                      </button>

                      {/* Discount or Sale indicators */}
                      {product.discount && (
                        <div className="absolute top-4 left-4 bg-red-600 text-[10px] font-semibold tracking-wider text-white font-mono px-2 py-1">
                          {product.discount}
                        </div>
                      )}
                      {product.isSoldOut && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/75 py-3 text-center font-mono text-xs font-semibold tracking-[0.2em] text-white">
                          SOLD OUT
                        </div>
                      )}
                    </div>

                    {/* Metadata Content */}
                    <div className="mt-4 flex flex-col flex-grow justify-between">
                      <div className="cursor-pointer" onClick={() => handleProductClick(product)}>
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-[10px] tracking-widest text-luxury-gray uppercase">
                            {product.brand}
                          </p>
                          <span className="font-mono text-[9px] tracking-wider text-luxury-charcoal bg-luxury-border/30 border border-luxury-border px-1.5 py-0.5 rounded uppercase">
                            Size: {product.sizeLabel || product.size}
                          </span>
                        </div>
                        <h4 className="font-serif text-[14px] font-medium tracking-tight text-luxury-charcoal mt-1 group-hover:underline">
                          {product.title}
                        </h4>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-luxury-border/40 flex items-center justify-between">
                        <span className="font-sans text-[11px] text-luxury-gray font-light uppercase">
                          {product.conditionConfirmed === false ? 'Condition to be added' : product.conditionNote || `${product.condition} Condition`}
                        </span>
                        <div>
                          {product.originalPrice ? (
                            <div className="flex space-x-2 items-baseline">
                              <span className="font-mono text-xs font-semibold text-red-600">{formatINR(product.price)}</span>
                              <span className="font-mono text-[10px] text-luxury-gray line-through">{formatINR(product.originalPrice)}</span>
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-luxury-charcoal font-semibold">{product.price > 0 ? formatINR(product.price) : 'Price to be added'}</span>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-luxury-gray">Shipping extra · Free over ₹900</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-luxury-border text-center bg-luxury-border/10">
                <p className="font-serif italic text-lg text-luxury-charcoal">No unique archives match your combination.</p>
                <p className="font-sans text-xs text-luxury-gray mt-2">Try clearing your selected sizes or text search query.</p>
                <button
                  onClick={resetAllFilters}
                  className="bg-[#1C1C1C] text-white font-semibold text-xs tracking-widest px-6 py-3 mt-6 uppercase hover:bg-opacity-90"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4 border-t border-luxury-border pt-12 mt-16 font-sans text-xs">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1.5 border border-luxury-border text-luxury-charcoal uppercase font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-luxury-border/20 transition-colors"
                >
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 w-8 flex items-center justify-center border font-mono tracking-widest transition-colors ${
                        currentPage === pageNum
                          ? 'border-[#1C1C1C] bg-[#1C1C1C] text-white font-semibold'
                          : 'border-luxury-border text-luxury-charcoal hover:border-[#1C1C1C]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1.5 border border-luxury-border text-luxury-charcoal uppercase font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-luxury-border/20 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Slide-out Mobile Filters Overlay */}
      <AnimatePresence>
        {showMobileFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFilters(false)}
              className="fixed inset-0 z-40 bg-black md:hidden"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-filters-title"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-50 w-4/5 max-w-sm bg-luxury-sand p-6 shadow-2xl overflow-y-auto md:hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-luxury-border">
                <h3 id="mobile-filters-title" className="font-serif text-lg font-bold tracking-wider text-luxury-charcoal">FILTER ARCHIVES</h3>
                <button className="inline-flex h-11 w-11 items-center justify-center" aria-label="Close filters" onClick={() => setShowMobileFilters(false)}>
                  <X className="h-5 w-5 text-luxury-charcoal" />
                </button>
              </div>

              <div className="space-y-8 pt-6">
                {/* Mobile Categories */}
                <div>
                  <h4 className="font-mono text-[10px] font-semibold tracking-widest text-luxury-charcoal uppercase mb-3">
                    Category List
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                        className={`text-xs px-3 py-1.5 border tracking-wider transition-colors uppercase ${
                          selectedCategory === cat
                            ? 'bg-[#1C1C1C] text-white border-[#1C1C1C]'
                            : 'border-luxury-border text-luxury-charcoal'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block font-mono text-[10px] font-semibold uppercase tracking-widest text-luxury-charcoal">Brand
                  <select value={selectedBrand} onChange={(event) => { setSelectedBrand(event.target.value); setCurrentPage(1); }} className="mt-3 min-h-11 w-full border border-luxury-border bg-transparent px-3 font-sans text-sm font-normal tracking-normal">
                    <option value="">All brands</option>{brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                  </select>
                </label>

                {/* Mobile Sizes */}
                <div>
                  <h4 className="font-mono text-[10px] font-semibold tracking-widest text-luxury-charcoal uppercase mb-3">
                    Select Size
                  </h4>
                  <div className="flex gap-2">
                    {sizes.map((sz) => {
                      const isActive = selectedSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          onClick={() => handleSizeToggle(sz)}
                          className={`flex h-9 w-9 items-center justify-center font-mono text-xs border tracking-wider transition-colors ${
                            isActive
                              ? 'bg-[#1C1C1C] text-white border-[#1C1C1C]'
                              : 'border-luxury-border text-luxury-charcoal'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <fieldset className="space-y-2">
                  <legend className="font-mono text-[10px] font-semibold tracking-widest text-luxury-charcoal uppercase mb-3">Price range (₹)</legend>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs text-luxury-gray">Minimum<input type="number" min="0" value={minPrice} onChange={(event) => { setMinPrice(event.target.value === '' ? '' : Number(event.target.value)); setCurrentPage(1); }} className="mt-1 min-h-11 w-full border border-luxury-border bg-transparent px-2 text-sm text-luxury-charcoal" /></label>
                    <label className="text-xs text-luxury-gray">Maximum<input type="number" min="0" value={maxPrice} onChange={(event) => { setMaxPrice(event.target.value === '' ? '' : Number(event.target.value)); setCurrentPage(1); }} className="mt-1 min-h-11 w-full border border-luxury-border bg-transparent px-2 text-sm text-luxury-charcoal" /></label>
                  </div>
                </fieldset>

                {/* Mobile Condition */}
                <div>
                  <h4 className="font-mono text-[10px] font-semibold tracking-widest text-[#1C1C1C] uppercase mb-3">
                    Quality Rating
                  </h4>
                  <div className="space-y-2.5">
                    {conditions.map((cond) => {
                      const isActive = selectedConditions.includes(cond);
                      return (
                        <button
                          key={cond}
                          onClick={() => handleConditionToggle(cond)}
                          className="flex items-center text-left space-x-3 w-full"
                        >
                          <div className={`flex h-4.5 w-4.5 items-center justify-center border ${
                            isActive ? 'bg-[#1C1C1C] border-[#1C1C1C] text-white' : 'border-luxury-border'
                          }`}>
                            {isActive && <Check className="h-3 w-3" />}
                          </div>
                          <span className="font-sans text-xs">{cond}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile Clear Button */}
                <button
                  onClick={() => {
                    resetAllFilters();
                    setShowMobileFilters(false);
                  }}
                  className="w-full text-center font-mono text-[10px] tracking-widest text-red-600 border border-red-200 py-3 mt-6 uppercase"
                >
                  Clear All Filters
                </button>

                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full bg-[#1C1C1C] text-white font-semibold text-xs tracking-widest py-3 uppercase hover:opacity-90"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
