import React, { useState, useMemo } from 'react';
import { ViewState, CartItem, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Ticket, Check, X } from 'lucide-react';
import { formatINR } from '../utils/currency';

interface CartViewProps {
  cart: CartItem[];
  setView: (view: ViewState) => void;
  setSelectedProduct: (product: Product) => void;
  onUpdateQty: (productId: string, size: 'XS' | 'S' | 'M' | 'L' | 'XL', delta: number) => void;
  onRemoveItem: (productId: string, size: 'XS' | 'S' | 'M' | 'L' | 'XL') => void;
  onClearCart: () => void;
}

export default function CartView({
  cart,
  setView,
  setSelectedProduct,
  onUpdateQty,
  onRemoveItem,
  onClearCart
}: CartViewProps) {
  const [promoCode, setPromoCode] = useState<string>('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = useState<string>('');
  const [isCheckoutSuccess, setIsCheckoutSuccess] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<number>(1); // 1 = detail, 2 = success

  // Subtotal Sum
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  // Handle applied percentage discounts
  const discountVal = useMemo(() => {
    if (!appliedDiscount) return 0;
    return subtotal * (appliedDiscount.percent / 100);
  }, [subtotal, appliedDiscount]);

  const tax = useMemo(() => {
    return (subtotal - discountVal) * 0.12;
  }, [subtotal, discountVal]);

  const shippingCost = subtotal > 0 ? 0.00 : 0.00; // Flat complimentary carbon-neutral shipping
  const grandTotal = subtotal > 0 ? (subtotal - discountVal) + tax + shippingCost : 0;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const upperCode = promoCode.trim().toUpperCase();

    if (upperCode === 'CONSCIOUS10' || upperCode === 'GOSH10' || upperCode === 'CIRCULAR10') {
      setAppliedDiscount({ code: upperCode, percent: 10 });
      setPromoCode('');
    } else if (upperCode === 'FOUNDER20') {
      setAppliedDiscount({ code: upperCode, percent: 20 });
      setPromoCode('');
    } else {
      setPromoError('Voucher code not recognized in registry.');
    }
  };

  const handleCheckoutComplete = () => {
    setView('checkout');
  };

  const handleSuccessClose = () => {
    setIsCheckoutSuccess(false);
    onClearCart();
    setView('home');
  };

  const stripeKeyDetails = "EST-CS-" + Math.floor(100000 + Math.random() * 900000);

  return (
    <div className="bg-luxury-sand min-h-screen py-10 px-6 md:py-16 md:px-12 text-left">
      <div className="mx-auto max-w-7xl">
        
        {/* Underlined Header Title */}
        <div className="border-b border-luxury-border pb-6 mb-12 flex justify-between items-end">
          <div>
            <h2 className="font-serif text-3xl font-light tracking-tight text-luxury-charcoal uppercase md:text-4xl">
              Shopping Bag
            </h2>
            <p className="font-sans text-xs text-luxury-gray mt-2 max-w-md">
              Review your curated selection. Unused, authentic items are reserved on current session holds.
            </p>
          </div>
          <span className="font-mono text-xs text-luxury-gray uppercase">
            {cart.length} {cart.length === 1 ? 'Design Item' : 'Design Items'}
          </span>
        </div>

        {cart.length > 0 ? (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-start">
            
            {/* LEFT Column - Cart items list */}
            <div className="lg:col-span-8 space-y-6">
              {cart.map((item, idx) => (
                <motion.div
                  key={`${item.product.id}-${item.selectedSize}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex flex-col sm:flex-row items-center border border-luxury-border bg-[#FBFBFA] p-5 relative"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => {
                      setSelectedProduct(item.product);
                      setView('detail');
                    }}
                    className="h-32 w-24 overflow-hidden bg-gray-100 border border-luxury-border flex-shrink-0 cursor-pointer"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="h-full w-full object-cover object-top hover:scale-102 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Descriptions block */}
                  <div className="mt-4 sm:mt-0 sm:ml-6 flex-grow flex flex-col justify-between self-stretch">
                    <div>
                      <div className="flex justify-between items-baseline">
                        <span className="font-mono text-[9px] tracking-widest text-luxury-gray uppercase">{item.product.brand}</span>
                        <span className="font-mono text-xs font-semibold text-luxury-charcoal">{formatINR(item.product.price * item.quantity)}</span>
                      </div>
                      
                      <h4
                        onClick={() => {
                          setSelectedProduct(item.product);
                          setView('detail');
                        }}
                        className="font-serif text-base font-semibold tracking-tight text-luxury-charcoal mt-1 hover:underline cursor-pointer"
                      >
                        {item.product.title}
                      </h4>
                      
                      <div className="flex gap-4 mt-2.5 text-[11px] font-sans text-luxury-gray uppercase">
                        <span>Selected Size: <strong className="text-luxury-charcoal">{item.selectedSize}</strong></span>
                        <span>•</span>
                        <span>Condition: <strong className="text-luxury-charcoal">{item.product.condition}</strong></span>
                      </div>
                    </div>

                    {/* Quantity controls & Remove row */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-luxury-border bg-white rounded">
                        <button
                          onClick={() => onUpdateQty(item.product.id, item.selectedSize, -1)}
                          className="px-2 py-1 hover:bg-neutral-100 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3 text-luxury-charcoal" />
                        </button>
                        <span className="px-3.5 font-mono text-xs font-semibold text-luxury-charcoal">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQty(item.product.id, item.selectedSize, 1)}
                          className="px-2 py-1 hover:bg-neutral-100 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3 text-luxury-charcoal" />
                        </button>
                      </div>

                      <button
                        id={`remove-${item.product.id}-${item.selectedSize}`}
                        onClick={() => onRemoveItem(item.product.id, item.selectedSize)}
                        className="flex items-center space-x-1 font-mono text-[10px] tracking-widest text-luxury-gray hover:text-red-600 transition-colors uppercase font-medium"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove Item</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* RIGHT Column - Cost Breakdown Order Summary */}
            <div className="lg:col-span-4 bg-[#FBFBFA] border border-luxury-border p-6 shadow-xs space-y-6">
              <h3 className="font-serif text-lg font-semibold tracking-wider text-luxury-charcoal uppercase border-b border-luxury-border pb-3">
                Order Summary
              </h3>

              <div className="space-y-3.5 font-sans text-xs text-luxury-gray">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="font-mono text-luxury-charcoal font-semibold">{formatINR(subtotal)}</span>
                </div>

                {/* Applied voucher code */}
                {appliedDiscount && (
                  <div className="flex justify-between text-emerald-700 bg-emerald-50 border border-emerald-100 p-2.5 rounded">
                    <div className="flex items-center space-x-1">
                      <Ticket className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="font-medium">CODE: {appliedDiscount.code} (-{appliedDiscount.percent}%)</span>
                    </div>
                    <button
                      onClick={() => setAppliedDiscount(null)}
                      className="text-red-500 hover:text-red-700"
                      aria-label="Remove discount"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {appliedDiscount && (
                  <div className="flex justify-between">
                    <span>Campaign Discount</span>
                    <span className="font-mono text-emerald-700 font-semibold">-{formatINR(discountVal)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>DHL Eco Express Shipping</span>
                  <span className="font-mono text-emerald-700 uppercase font-bold">Complimentary</span>
                </div>

                <div className="flex justify-between">
                  <span>GST (12%)</span>
                  <span className="font-mono text-luxury-charcoal font-semibold">{formatINR(tax)}</span>
                </div>

                <div className="border-t border-luxury-border/60 pt-4 flex justify-between text-base font-serif text-luxury-charcoal">
                  <span>Estimated Total</span>
                  <span className="font-mono font-bold">{formatINR(grandTotal)}</span>
                </div>
              </div>

              {/* Promo input form */}
              <form onSubmit={handleApplyPromo} className="border-t border-b border-luxury-border/60 py-4 space-y-2">
                <label className="font-mono text-[9px] tracking-widest text-luxury-gray uppercase block font-semibold">
                  Offer Code / Archive Voucher
                </label>
                <div className="relative flex items-center border border-luxury-border bg-white rounded p-1">
                  <input
                    id="promo-input"
                    type="text"
                    placeholder="Enter Coupon... (GOSH10)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full bg-transparent pl-2 font-sans text-xs text-luxury-charcoal outline-none mr-2 uppercase"
                  />
                  <button
                    id="apply-promo"
                    type="submit"
                    className="bg-luxury-charcoal text-white font-mono text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-sm hover:opacity-90 transition-opacity"
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <p className="font-sans text-[10px] text-red-600 italic">{promoError}</p>
                )}
              </form>

              {/* Secure Checkout Trust */}
              <div className="space-y-4">
                <button
                  id="checkout-trigger"
                  onClick={handleCheckoutComplete}
                  className="w-full flex items-center justify-center space-x-3 bg-luxury-charcoal font-semibold text-xs tracking-widest text-[#FAF9F6] py-[16px] uppercase hover:bg-opacity-95 transition-all"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="flex items-center justify-center space-x-2 text-[10px] text-luxury-gray text-center font-sans">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <span>Carbon-inclusive checkout guaranteed.</span>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-luxury-border text-center bg-luxury-border/10 max-w-lg mx-auto rounded">
            <ShoppingBag className="h-10 w-10 text-luxury-gray mb-4 animate-pulse" />
            <p className="font-serif italic text-lg text-luxury-charcoal">Your bag is empty of historical archives.</p>
            <p className="font-sans text-xs text-luxury-gray mt-2 max-w-xs">
              Take a walk through our freshly checked-in seasonal direction to select premium, pre-owned wardrobe anchors.
            </p>
            <button
              onClick={() => setView('shop')}
              className="group flex items-center space-x-3 bg-luxury-charcoal font-semibold text-xs tracking-widest text-[#FAF9F6] px-8 py-3.5 mt-8 uppercase hover:bg-opacity-90 transition-all"
            >
              <span>Explore Modern Archives</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}
      </div>

      {/* Slide-Up Checkout Completion Dialog Modal */}
      <AnimatePresence>
        {isCheckoutSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden p-4">
            {/* Dark background drop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={handleSuccessClose}
              className="fixed inset-0 bg-black"
            />
            
            {/* Modal Card content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-luxury-sand text-luxury-charcoal max-w-md w-full border border-luxury-border p-8 shadow-2xl relative z-10 text-center space-y-6"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                <Check className="h-7 w-7" />
              </div>

              <div className="space-y-2">
                <p className="font-mono text-[9px] tracking-[0.25em] text-emerald-700 uppercase font-bold">
                  GOSH DISPATCH SECURED
                </p>
                <h3 className="font-serif text-2xl font-light tracking-wide text-luxury-charcoal uppercase">
                  Thank You For Circulating
                </h3>
                <p className="font-sans text-xs text-luxury-gray leading-relaxed max-w-xs mx-auto">
                  Your carbon-offset shipping label has been allocated. Our Parisian workshop is initiating final inspection, authentication review, and organic restoration grading.
                </p>
              </div>

              {/* Simulated Registry reference numbers */}
              <div className="bg-[#FAFBF9] border border-luxury-border p-4 rounded text-left font-mono text-[10px] space-y-2 text-luxury-gray">
                <div className="flex justify-between">
                  <span>Eco-Logistics ID:</span>
                  <span className="text-luxury-charcoal font-semibold">{stripeKeyDetails}</span>
                </div>
                <div className="flex justify-between">
                  <span>Carbon Compensation:</span>
                  <span className="text-emerald-700 font-bold">-14.2 kg CO₂ Offset</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-luxury-border/50 text-luxury-charcoal">
                  <span>Total Debit Amount:</span>
                  <span className="font-sans font-bold">{formatINR(grandTotal)}</span>
                </div>
              </div>

              <button
                id="checkout-close"
                onClick={handleSuccessClose}
                className="w-full bg-luxury-charcoal font-semibold text-xs tracking-widest text-[#FAF9F6] py-3.5 uppercase hover:opacity-90 transition-all shadow-md"
              >
                Return to GOSH Studio
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
