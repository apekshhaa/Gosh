import React, { useState, useEffect } from 'react';
import { ViewState, Product } from '../types';
import { products } from '../data';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Maximize2, X, Scale, RefreshCw, Milestone } from 'lucide-react';
import { formatINR } from '../utils/currency';

interface ProductDetailViewProps {
  product: Product;
  setView: (view: ViewState) => void;
  setSelectedProduct: (product: Product) => void;
}

export default function ProductDetailView({
  product,
  setView,
  setSelectedProduct,
}: ProductDetailViewProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);

  // Accordion state
  const [openSection, setOpenSection] = useState<'measurements' | 'shipping' | null>(null);

  // Sync active image with product modification
  useEffect(() => {
    setActiveSlide(0);
    setIsImageFullscreen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  const gallerySlides = [
    { label: 'Skirt photo', src: product.image },
    ...(product.id === 'brown-ruched-marble-skirt' && product.images[1]
      ? [{ label: 'Styling ideas', src: product.images[1] }]
      : (product.images || []).slice(1).map((src, index) => ({ label: `View ${index + 2}`, src })))
  ];
  const currentSlide = gallerySlides[activeSlide] || gallerySlides[0];

  useEffect(() => {
    if (!isImageFullscreen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsImageFullscreen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isImageFullscreen]);

  // Get matching products (same category or general recommendations, excluding active)
  const curatedMatches = products
    .filter((p) => p.id !== product.id)
    .slice(0, 3);

  const toggleSection = (section: 'measurements' | 'shipping') => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className="bg-luxury-sand min-h-screen py-12 px-6 md:py-20 md:px-12">
      <div className="mx-auto max-w-7xl">
        
        {/* Breadcrumb utility info */}
        <div className="flex items-center space-x-2 font-mono text-[10px] tracking-widest text-luxury-gray uppercase mb-10 pb-4 border-b border-luxury-border/30">
          <button onClick={() => setView('home')} className="hover:text-luxury-charcoal">Home</button>
          <span>/</span>
          <button onClick={() => setView('shop')} className="hover:text-luxury-charcoal">The Collection</button>
          <span>/</span>
          <span className="text-luxury-charcoal font-medium truncate">{product.brand} • {product.title}</span>
        </div>

        {/* Master Detail Section */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-start">
          
          {/* LEFT Sidebar - Image Swapper */}
          <div className="lg:col-span-7 space-y-4">
            <div className="relative aspect-3/4 w-full overflow-hidden bg-[#FAFBF9] border border-luxury-border">
              <AnimatePresence mode="wait">
                <motion.button key={activeSlide} type="button" onClick={() => setIsImageFullscreen(true)} aria-label={`View ${currentSlide.label} full screen`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="absolute inset-0 flex h-full w-full cursor-zoom-in items-center justify-center bg-[#f6f1e9]">
                  <img src={currentSlide.src} alt={`${product.title} — ${currentSlide.label}`} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                  <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-[10px] uppercase tracking-wider text-luxury-charcoal"><Maximize2 className="h-3.5 w-3.5"/> View full size</span>
                </motion.button>
              </AnimatePresence>

              {gallerySlides.length > 1 && <>
                <button onClick={() => setActiveSlide((slide) => (slide - 1 + gallerySlides.length) % gallerySlides.length)} aria-label="Previous skirt photo" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"><ChevronLeft className="h-5 w-5"/></button>
                <button onClick={() => setActiveSlide((slide) => (slide + 1) % gallerySlides.length)} aria-label="Next skirt photo" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"><ChevronRight className="h-5 w-5"/></button>
                <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 font-mono text-[10px]">{activeSlide + 1} / {gallerySlides.length}</span>
              </>}

              {/* Status Tag Overlay */}
              <div className="absolute top-4 left-4 bg-luxury-charcoal text-white font-mono text-[9px] tracking-widest px-2.5 py-1 uppercase font-medium">
                Sourced Archive
              </div>
            </div>

            {/* Thumbnail selector arrays */}
            {gallerySlides.length > 1 && (
              <div className="flex space-x-3">
                {gallerySlides.map((slide, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlide(index)}
                    className={`relative h-20 w-16 shrink-0 overflow-hidden border bg-white transition-opacity ${
                      activeSlide === index ? 'border-luxury-charcoal' : 'border-luxury-border opacity-60 hover:opacity-100'
                    }`}
                    aria-label={slide.label}
                  >
                    <img src={slide.src} alt="" className="h-full w-full object-cover object-top" referrerPolicy="no-referrer"/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT Sidebar - Commercial Specs panel */}
          <div className="lg:col-span-5 text-left">
            <p className="font-mono text-xs tracking-[0.25em] text-luxury-gray uppercase font-semibold">
              {product.brand}
            </p>
            <h1 className="font-serif text-3xl font-light tracking-tight text-luxury-charcoal mt-2 leading-[1.2] md:text-4xl">
              {product.title}
            </h1>
            
            {/* Price display */}
            <div className="mt-4 flex items-baseline space-x-3 pb-6 border-b border-luxury-border">
              {product.originalPrice ? (
                <>
                  <span className="font-mono text-xl font-bold text-red-600">{formatINR(product.price)}</span>
                  <span className="font-mono text-sm text-luxury-gray line-through">{formatINR(product.originalPrice)}</span>
                  <span className="font-mono text-xs text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded font-semibold uppercase">{product.discount} OFF</span>
                </>
              ) : (
                <span className="font-mono text-xl font-semibold text-luxury-charcoal">{product.price > 0 ? formatINR(product.price) : 'Price to be added'}</span>
              )}
            </div>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-luxury-gray">Shipping included in the price</p>

            {/* Specs Tags Badges */}
            <div className="flex flex-wrap gap-2 py-6 border-b border-luxury-border">
              <span id="badge-size" className="font-mono text-[10px] tracking-widest text-[#1C1C1C] border border-[#1C1C1C] bg-[#FBFBFA] px-3 py-1.5 uppercase font-medium">
                Size: {product.sizeLabel || product.size}
              </span>
              {product.conditionConfirmed !== false && <span id="badge-condition" className="font-mono text-[10px] tracking-widest text-[#1C1C1C] border border-[#1C1C1C] bg-[#FBFBFA] px-3 py-1.5 uppercase font-medium">
                Condition: {product.condition}
              </span>}
              <span id="badge-material" className="font-mono text-[10px] tracking-widest text-[#1C1C1C] border border-[#1C1C1C] bg-[#FBFBFA] px-3 py-1.5 uppercase font-medium">
                Material: {product.material}
              </span>
            </div>

            {/* Main description description block */}
            <div className="py-6 border-b border-luxury-border">
              <p className="font-sans text-sm text-luxury-gray leading-relaxed font-light first-letter:text-3xl first-letter:font-serif first-letter:mr-2 first-letter:float-left first-letter:text-luxury-charcoal">
                {product.description}
              </p>
            </div>

            {/* Item sizing */}
            <div className="py-6 border-b border-luxury-border">
              <label className="font-mono text-[10px] tracking-widest text-luxury-gray uppercase font-semibold">Fit</label>
              <div className="flex items-center justify-between mt-3">
                <span className="font-sans text-xs text-luxury-charcoal">
                  Fitted spec: <strong>Size {product.sizeLabel || product.size}</strong>.
                </span>
                <span className="font-mono text-[10px] text-luxury-gray uppercase">Available to view</span>
              </div>
            </div>

            {/* Accordion list */}
            <div className="border-t border-luxury-border">
              {/* Measurements Section */}
              <div className="border-b border-luxury-border">
                <button
                  id="toggle-measurements"
                  onClick={() => toggleSection('measurements')}
                  className="w-full flex justify-between items-center py-4 font-serif text-[15px] font-medium tracking-wide text-luxury-charcoal text-left"
                >
                  <span>Measurements & Precise Fit</span>
                  {openSection === 'measurements' ? <ChevronUp className="h-4.5 w-4.5 text-luxury-charcoal" /> : <ChevronDown className="h-4.5 w-4.5 text-luxury-charcoal" />}
                </button>
                <AnimatePresence initial={false}>
                  {openSection === 'measurements' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pb-4"
                    >
                      <div className="bg-[#FAFBF9] border border-luxury-border p-4 text-xs space-y-3 font-mono text-luxury-gray">
                        <p className="font-sans text-xs italic text-luxury-charcoal">
                          Archival items fit differently than modern sizing parameters. Please review measurements below:
                        </p>
                        <p className="pt-2 border-t border-luxury-border/50 text-luxury-charcoal font-semibold">{product.measurements}</p>
                        <div className="flex items-center space-x-2 text-luxury-charcoal font-sans text-[11px] pt-1">
                          <Scale className="h-4 w-4" />
                          <span>Use the listed measurements as a fit guide.</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Shipping Section */}
              <div className="border-b border-luxury-border">
                <button
                  id="toggle-shipping"
                  onClick={() => toggleSection('shipping')}
                  className="w-full flex justify-between items-center py-4 font-serif text-[15px] font-medium tracking-wide text-luxury-charcoal text-left"
                >
                  <span>Premium Shipping & Safe Returns</span>
                  {openSection === 'shipping' ? <ChevronUp className="h-4.5 w-4.5 text-luxury-charcoal" /> : <ChevronDown className="h-4.5 w-4.5 text-luxury-charcoal" />}
                </button>
                <AnimatePresence initial={false}>
                  {openSection === 'shipping' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pb-4"
                    >
                      <div className="bg-[#FAFBF9] border border-luxury-border p-4 text-xs space-y-3 font-mono text-neutral-600">
                        <p className="font-sans text-xs text-luxury-gray mt-1 leading-relaxed">
                          {product.shipping}
                        </p>
                        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-luxury-border/50 font-sans text-[10px] text-luxury-charcoal uppercase">
                          <div className="flex items-center space-x-1.5">
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>14-Day Free Returns</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Milestone className="h-3.5 w-3.5" />
                            <span>Carbon-Neutral Cycle</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>

        {/* Curated Matches Carousel */}
        <section className="border-t border-luxury-border pt-16 mt-20">
          <p className="font-mono text-[10px] tracking-[0.25em] text-luxury-gray uppercase text-left mb-2">
            STYLING HARMONIES
          </p>
          <h3 className="font-serif text-2xl font-light text-left text-luxury-charcoal mb-10">
            Curated Matches For This Piece
          </h3>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {curatedMatches.map((match) => (
              <div
                key={match.id}
                onClick={() => setSelectedProduct(match)}
                className="group relative flex flex-col cursor-pointer"
              >
                <div className="relative aspect-3/4 w-full overflow-hidden bg-gray-100 border border-luxury-border">
                  <img
                    src={match.image}
                    alt={match.title}
                    className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-101"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-luxury-sand/90 text-luxury-charcoal font-mono text-[9px] tracking-wider px-2 py-0.5 uppercase border border-luxury-border rounded">
                    Match
                  </div>
                </div>

                <div className="mt-4 flex flex-col items-start text-left">
                  <p className="font-mono text-[9px] tracking-widest text-luxury-gray uppercase">
                    {match.brand}
                  </p>
                  <h4 className="font-serif text-sm font-medium tracking-tight text-luxury-charcoal mt-1 group-hover:underline">
                    {match.title}
                  </h4>
                  <span className="font-mono text-xs text-luxury-charcoal font-semibold mt-1">
                    {formatINR(match.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
      <AnimatePresence>
        {isImageFullscreen && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 sm:p-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsImageFullscreen(false)}>
            <button type="button" onClick={() => setIsImageFullscreen(false)} aria-label="Close full-screen image" className="absolute right-4 top-4 z-10 rounded-full bg-white/95 p-3 text-black shadow-lg sm:right-6 sm:top-6"><X className="h-5 w-5"/></button>
            <img src={currentSlide.src} alt={`${product.title} — ${currentSlide.label}, full-screen view`} onClick={(event) => event.stopPropagation()} className="max-h-full max-w-full object-contain" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
