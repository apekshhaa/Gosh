import React, { useState } from 'react';
import { ViewState, CartItem, Product } from '../types';
import { MapPin, Truck, Copy, Check, Info, HelpCircle, ArrowLeft, RefreshCw, Send, Ship } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { editorialImages, productImages } from '../images';
import { formatINR } from '../utils/currency';

interface TrackingViewProps {
  setView: (view: ViewState) => void;
  orderId?: string;
  shippedItems?: CartItem[];
}

export default function TrackingView({ setView, orderId = 'CL-849201A', shippedItems = [] }: TrackingViewProps) {
  const [copied, setCopied] = useState(false);
  const [supportSubmitted, setSupportSubmitted] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Fallback demo product if items list is empty
  const defaultTrackItem = {
    product: {
      id: 'default-overcoat',
      title: 'Tailored Wool Overcoat',
      brand: 'GOSH Core',
      price: 51900,
      image: productImages.woolOvercoat,
      images: [],
      category: 'outerwear',
      subcategory: 'Outerwear',
      size: 'M',
      condition: 'Pristine',
      material: '100% Recycled Italian Wool',
      description: 'Elegant slim collar drape structure coat with minimal horn buttons.',
      measurements: '',
      shipping: ''
    } as Product,
    quantity: 1,
    selectedSize: 'M' as const
  };

  const activeItems = shippedItems.length > 0 ? shippedItems : [defaultTrackItem];

  const handleCopyTracking = () => {
    navigator.clipboard.writeText('PLI-99283-X7Q');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (supportMessage.trim()) {
      setSupportSubmitted(true);
      setSupportMessage('');
      setTimeout(() => {
        setSupportSubmitted(false);
        setIsSupportOpen(false);
      }, 3500);
    }
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b] min-h-screen font-sans">
      <main className="max-w-7xl mx-auto px-6 py-12 md:px-12">
        {/* Header Navigation breadcrumbs */}
        <div id="tracking-breadcrumbs" className="mb-8 flex items-center justify-between">
          <button
            onClick={() => setView('home')}
            className="flex items-center text-xs font-semibold text-luxury-gray uppercase tracking-widest hover:text-luxury-charcoal transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-0.5" />
            Back to Studio
          </button>
          
          <div className="text-xs font-mono text-luxury-gray bg-[#FAF9F6] px-3.5 py-1.5 border border-[#eae7e7] rounded-full">
            REAL-TIME TELEMETRY CONNECTED
          </div>
        </div>

        {/* Primary Page Header */}
        <div className="mb-12 text-left">
          <p className="font-mono text-[10px] tracking-[0.25em] text-luxury-gray uppercase mb-2">
            Logistics Verification System
          </p>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-wide text-luxury-charcoal uppercase">
            Tracking Details
          </h1>
          <p className="font-sans text-sm text-luxury-gray mt-2">
            Order <span className="font-semibold text-luxury-charcoal">#{orderId}</span> • Estimated Arrival:{' '}
            <span className="font-semibold text-emerald-800">Oct 24 (In 3 Days)</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Column: Map & Timeline list */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Map image graphic container */}
            <div className="bg-white border border-[#eae7e7] rounded-2xl overflow-hidden relative shadow-sm group">
              <div className="relative h-64 md:h-[380px] w-full">
                <img
                  alt="Delivery routing map representation"
                  className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-[101%] transition-transform duration-1000 ease-out"
                  referrerPolicy="no-referrer"
                  src={editorialImages.trackingMap}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent pointer-events-none" />
                
                {/* Real-time status ping badge map overlay */}
                <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#eae7e7] flex items-center gap-3 shadow-md">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-600 opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                  </span>
                  <span className="font-sans text-xs font-semibold text-luxury-charcoal uppercase tracking-widest">
                    In Transit - Regional Facility
                  </span>
                </div>
              </div>
            </div>

            {/* Step Timeline Journey History */}
            <div className="bg-white border border-[#eae7e7] rounded-2xl p-6 md:p-8 space-y-8 text-left shadow-sm">
              <h2 className="font-serif text-xl tracking-wide text-luxury-charcoal uppercase">
                Journey History
              </h2>
              
              <div className="relative border-l border-[#eae7e7] ml-4 space-y-8 pb-4">
                {/* Journey step 1 */}
                <div className="relative pl-8">
                  <span className="absolute -left-[10.5px] top-1 bg-[#fcf9f8] border-2 border-luxury-charcoal w-5 h-5 rounded-full flex items-center justify-center">
                    <span className="bg-luxury-charcoal w-2 h-2 rounded-full" />
                  </span>
                  
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                    <div>
                      <h3 className="font-sans text-sm font-semibold text-luxury-charcoal uppercase tracking-wider">
                        Departed Regional Facility
                      </h3>
                      <p className="font-sans text-xs text-luxury-gray mt-1 leading-relaxed">
                        Package is in transit to the destination routing center.
                      </p>
                      <span className="inline-block mt-2 font-mono text-[9px] bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">
                        Newark, NJ
                      </span>
                    </div>
                    <span className="font-mono text-[10px] tracking-wider text-luxury-gray md:text-right shrink-0">
                      Oct 22, 08:14 AM
                    </span>
                  </div>
                </div>

                {/* Journey step 2 */}
                <div className="relative pl-8">
                  <span className="absolute -left-[9px] top-1 bg-white border border-gray-300 w-4.5 h-4.5 rounded-full flex items-center justify-center">
                    <span className="bg-emerald-500 w-2 h-2 rounded-full" />
                  </span>
                  
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                    <div>
                      <h3 className="font-sans text-sm font-medium text-luxury-charcoal/80 uppercase tracking-wider">
                        Arrived at Regional Facility
                      </h3>
                      <p className="font-sans text-xs text-luxury-gray mt-1 leading-relaxed">
                        Package checked in and processed through automated scanner grid.
                      </p>
                      <span className="inline-block mt-2 font-mono text-[9px] bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">
                        Newark, NJ
                      </span>
                    </div>
                    <span className="font-mono text-[10px] tracking-wider text-luxury-gray md:text-right shrink-0">
                      Oct 21, 11:45 PM
                    </span>
                  </div>
                </div>

                {/* Journey step 3 */}
                <div className="relative pl-8">
                  <span className="absolute -left-[9px] top-1 bg-white border border-gray-300 w-4.5 h-4.5 rounded-full flex items-center justify-center">
                    <span className="bg-emerald-500 w-2 h-2 rounded-full" />
                  </span>
                  
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                    <div>
                      <h3 className="font-sans text-sm font-medium text-luxury-charcoal/80 uppercase tracking-wider">
                        Order Dispatched from Hub
                      </h3>
                      <p className="font-sans text-xs text-luxury-gray mt-1 leading-relaxed">
                        Package handed over to DHL Express air logistics system.
                      </p>
                      <span className="inline-block mt-2 font-mono text-[9px] bg-neutral-100 px-2 py-0.5 rounded text-neutral-600">
                        Milan, Italy
                      </span>
                    </div>
                    <span className="font-mono text-[10px] tracking-wider text-luxury-gray md:text-right shrink-0">
                      Oct 20, 04:30 PM
                    </span>
                  </div>
                </div>

                {/* Journey step 4 */}
                <div className="relative pl-8">
                  <span className="absolute -left-[9px] top-1 bg-white border border-gray-300 w-4.5 h-4.5 rounded-full flex items-center justify-center">
                    <span className="bg-emerald-500 w-2 h-2 rounded-full" />
                  </span>
                  
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2">
                    <div>
                      <h3 className="font-sans text-sm font-medium text-luxury-charcoal/80 uppercase tracking-wider">
                        Archive Registered and Curated
                      </h3>
                      <p className="font-sans text-xs text-luxury-gray mt-1 leading-relaxed">
                        Our workshop team fully authenticated, steamed, graded, and boxed the capsule array.
                      </p>
                    </div>
                    <span className="font-mono text-[10px] tracking-wider text-luxury-gray md:text-right shrink-0">
                      Oct 19, 09:12 AM
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Carrier details & shipment lists */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Carrier Details Card */}
            <div className="bg-white border border-[#eae7e7] rounded-3xl p-6 text-left shadow-sm space-y-6">
              <h3 className="font-mono text-[10px] tracking-[0.25em] text-luxury-gray uppercase">
                Carrier Details
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-[#FAF9F6] border border-[#eae7e7] rounded-xl flex items-center justify-center text-luxury-charcoal">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-serif text-base font-semibold text-luxury-charcoal">Premium Logistics Intl.</p>
                  <p className="font-sans text-xs text-luxury-gray">Expedited Air Cargo Flight</p>
                </div>
              </div>

              {/* Copyable Tracking code field */}
              <button
                type="button"
                onClick={handleCopyTracking}
                className="w-full bg-[#FAF9F6] hover:bg-neutral-100 border border-neutral-200 transition-colors rounded-xl p-4 flex justify-between items-center group cursor-pointer text-left"
              >
                <div className="space-y-1">
                  <span className="font-mono text-[9px] text-luxury-gray uppercase tracking-wider">Tracking Identifier</span>
                  <span className="block font-sans text-xs font-bold text-luxury-charcoal tracking-widest uppercase">PLI-99283-X7Q</span>
                </div>
                <div className="text-luxury-gray group-hover:text-luxury-charcoal transition-colors">
                  {copied ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-mono">
                      <Check className="h-4 w-4" /> Copied
                    </span>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </div>
              </button>
            </div>

            {/* Shipment Items List */}
            <div className="bg-white border border-[#eae7e7] rounded-3xl p-6 text-left shadow-sm space-y-6">
              <h3 className="font-mono text-[10px] tracking-[0.25em] text-luxury-gray uppercase">
                In This Shipment
              </h3>
              
              <div className="max-h-72 overflow-y-auto pr-1 space-y-5">
                {activeItems.map((item, index) => (
                  <div key={`${item.product.id}-${index}`} className="flex gap-4 items-center border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="w-16 h-20 bg-neutral-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center">
                      <img
                        alt={item.product.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                        src={item.product.image}
                      />
                    </div>
                    <div className="space-y-1.5 min-w-0 flex-grow">
                      <p className="font-serif text-sm font-semibold text-luxury-charcoal truncate">
                        {item.product.title}
                      </p>
                      <p className="font-sans text-xs text-luxury-gray capitalize">
                        {item.product.brand} • Size {item.selectedSize}
                      </p>
                      <div className="flex justify-between items-center font-mono text-[10px]">
                        <span className="text-luxury-charcoal bg-neutral-100 px-1.5 py-0.5 rounded">Qty: {item.quantity}</span>
                        <span className="font-sans text-xs font-semibold text-luxury-charcoal">{formatINR(item.product.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Need Help CTA block with sliding support form */}
            <div className="bg-white border border-[#eae7e7] rounded-3xl p-6 text-left shadow-sm space-y-4">
              <button
                type="button"
                onClick={() => setIsSupportOpen(!isSupportOpen)}
                className="w-full py-4 text-xs font-semibold text-luxury-charcoal border border-[#18231a] rounded-xl hover:bg-neutral-50 transition-colors flex justify-center items-center gap-2 uppercase tracking-widest"
              >
                <HelpCircle className="h-4 w-4" />
                Need help with this order?
              </button>

              <AnimatePresence>
                {isSupportOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {supportSubmitted ? (
                      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-center mt-2 space-y-1">
                        <Check className="h-5 w-5 text-emerald-600 mx-auto" />
                        <h4 className="font-serif text-sm text-[#18231a]">Inquiry Registered</h4>
                        <p className="font-sans text-[11px] text-luxury-gray">
                          An ethical concierge has been alerted. We respond in under 2 hours.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleSupportSubmit} className="space-y-3 pt-3">
                        <label className="block text-[10px] font-mono tracking-wider text-luxury-gray uppercase">
                          Message our atelier concierge
                        </label>
                        <textarea
                          required
                          rows={3}
                          placeholder="Ask us anything about shipping adjustments, custom tailoring requests, or eco parameters..."
                          value={supportMessage}
                          onChange={(e) => setSupportMessage(e.target.value)}
                          className="w-full bg-[#fcf9f8] border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-luxury-charcoal focus:ring-1 focus:ring-luxury-charcoal"
                        />
                        <button
                          type="submit"
                          className="w-full bg-luxury-charcoal hover:bg-neutral-800 transition-colors font-semibold text-[10px] font-sans tracking-widest text-white py-2.5 rounded-xl uppercase flex items-center justify-center gap-1.5"
                        >
                          Send Inquiry <Send className="h-3 w-3" />
                        </button>
                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
