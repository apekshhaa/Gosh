import React, { useState, useMemo } from 'react';
import { ViewState, CartItem, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, ArrowRight, CreditCard, Check, Ticket, X, ArrowLeft, RefreshCw } from 'lucide-react';
import { productImages } from '../images';
import { formatINR, EXPRESS_SHIPPING_INR } from '../utils/currency';

interface CheckoutViewProps {
  cart: CartItem[];
  setView: (view: ViewState) => void;
  onClearCart: () => void;
  onOrderSuccess?: (items: CartItem[], orderId: string) => void;
}

// Default items as shown in the screenshot for empty cart or demo
const demoItems = [
  {
    product: {
      id: 'demo-vintage-blazer',
      title: 'Vintage Silk Blazer',
      brand: 'Editorial Archival',
      price: 28600,
      image: productImages.silkBlazer,
      images: [],
      category: 'womens',
      subcategory: 'Outerwear',
      size: 'M',
      condition: 'Excellent',
      material: '100% Silk',
      description: 'Meticulously tailored vintage silk blazer in muted sage green.',
      measurements: '',
      shipping: ''
    } as Product,
    quantity: 1,
    selectedSize: 'M' as const
  },
  {
    product: {
      id: 'demo-woven-tote',
      title: 'Woven Leather Tote',
      brand: 'Editorial Archival',
      price: 23200,
      image: productImages.wovenTote,
      images: [],
      category: 'accessories',
      subcategory: 'Bags',
      size: 'XL',
      condition: 'Pristine',
      material: ' sustainable organic leather',
      description: 'Woven leather tote bag in warm terracotta brown.',
      measurements: '',
      shipping: ''
    } as Product,
    quantity: 1,
    selectedSize: 'XL' as const
  }
];

export default function CheckoutView({ cart, setView, onClearCart, onOrderSuccess }: CheckoutViewProps) {
  // Use user's real cart items if they exist; otherwise fallback to the high-fidelity demo items
  const isDemo = cart.length === 0;
  const activeItems = isDemo ? demoItems : cart;

  // Form states
  const [email, setEmail] = useState('');
  const [newsletter, setNewsletter] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [stateSel, setStateSel] = useState('');
  const [zip, setZip] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');

  // Credit card inputs
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Discount states
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(null);
  const [promoError, setPromoError] = useState('');

  // Checkout and animation states
  const [isLatching, setIsLatching] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const generatedId = useMemo(() => "CL-" + Math.floor(100000 + Math.random() * 900000) + "A", []);

  // Subtotal calculations
  const subtotal = useMemo(() => {
    return activeItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [activeItems]);

  // Discount value
  const discountVal = useMemo(() => {
    if (!appliedDiscount) return 0;
    return subtotal * (appliedDiscount.percent / 100);
  }, [subtotal, appliedDiscount]);

  const afterDiscountSubtotal = subtotal - discountVal;

  const shippingCost = shippingMethod === 'standard' ? 0 : EXPRESS_SHIPPING_INR;

  // GST calculation (12%)
  const tax = useMemo(() => {
    return afterDiscountSubtotal * 0.12;
  }, [afterDiscountSubtotal]);

  // Rounded Grand Total
  const grandTotal = afterDiscountSubtotal + shippingCost + tax;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (code === 'CONSCIOUS10' || code === 'CIRCULAR10') {
      setAppliedDiscount({ code, percent: 10 });
      setPromoCode('');
    } else if (code === 'FOUNDER20') {
      setAppliedDiscount({ code, percent: 20 });
      setPromoCode('');
    } else {
      setPromoError('Voucher code not recognized in registry.');
    }
  };

  const handleCompletePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate real transaction authorization with subtle delay
    setIsLatching(true);
    setTimeout(() => {
      setIsLatching(false);
      setIsSuccess(true);
      if (onOrderSuccess) {
        onOrderSuccess(activeItems, generatedId);
      }
    }, 1800);
  };

  const handleSuccessClose = () => {
    setIsSuccess(false);
    if (!isDemo) {
      onClearCart();
    }
    setView('home');
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b] min-h-screen font-sans flex flex-col antialiased">
      {/* Top Bar Navigation specifically and beautifully crafted for Secure Checkout */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-10 py-5 backdrop-blur-xl bg-white/80 border-b border-[#eae7e7]">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setView('cart')}
            className="flex items-center text-xs text-luxury-gray hover:text-luxury-charcoal transition-colors group"
            id="back-to-cart"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Bag</span>
          </button>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <button 
            onClick={() => setView('home')} 
            className="font-serif text-xl md:text-2xl font-semibold tracking-tight text-[#18231a] hover:opacity-85 transition-opacity"
            id="logo-button"
          >
            GOSH
          </button>
        </div>
        <div className="flex items-center gap-2 text-luxury-gray text-xs md:text-sm font-medium">
          <Lock className="h-4 w-4 text-[#18231a]" />
          <span>Secure Checkout</span>
        </div>
      </header>

      {/* Main Checkout Grid container */}
      <main className="flex-grow pt-28 pb-20 px-6 md:px-10 max-w-7xl mx-auto w-full text-left">
        {/* Banner notification if in demo fallback mode */}
        {isDemo && (
          <div className="mb-8 p-3 bg-neutral-100 border border-neutral-200 text-neutral-600 text-xs rounded flex justify-between items-center">
            <span>
              <strong>Secure Stage Preview:</strong> Your shopping bag is currently empty. Showing the design selection mock to demonstrate full layout.
            </span>
            <button 
              onClick={() => setView('shop')}
              className="underline hover:text-neutral-900 font-medium ml-2 flex items-center shrink-0"
              id="empty-view-shop"
            >
              Go to catalog <ArrowRight className="h-3 w-3 ml-1" />
            </button>
          </div>
        )}

        <form onSubmit={handleCompletePurchase} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          
          {/* LEFT Column: Interactive Form steps */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-12">
            
            {/* Step 1: Contact */}
            <section className="space-y-6" id="section-contact">
              <div className="flex justify-between items-end border-b border-gray-100 pb-3">
                <h2 className="font-serif text-xl tracking-tight text-[#18231a] font-medium flex items-center">
                  <span className="font-mono text-xs mr-2 border border-[#18231a] rounded-full w-5 h-5 flex items-center justify-center">1</span>
                  Contact
                </h2>
                <span className="text-xs text-luxury-gray">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => alert("Registration system is currently closed to public members.")}
                    className="text-[#18231a] underline hover:text-opacity-80 transition-opacity"
                    id="login-trigger"
                  >
                    Log in
                  </button>
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="checkout-email" className="block text-xs font-semibold text-luxury-gray uppercase tracking-widest mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#f6f3f2] border border-[#c4c8c1]/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#18231a] focus:ring-1 focus:ring-[#18231a] transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    id="newsletter-check"
                    type="checkbox"
                    checked={newsletter}
                    onChange={(e) => setNewsletter(e.target.checked)}
                    className="rounded border-[#c4c8c1] text-[#18231a] focus:ring-[#18231a] w-5 h-5 bg-[#f6f3f2]"
                  />
                  <label htmlFor="newsletter-check" className="text-xs text-luxury-gray cursor-pointer select-none">
                    Email me with news and offers regarding future capsule releases
                  </label>
                </div>
              </div>
            </section>

            {/* Step 2: Shipping */}
            <section className="space-y-6" id="section-shipping">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="font-serif text-xl tracking-tight text-[#18231a] font-medium flex items-center">
                  <span className="font-mono text-xs mr-2 border border-[#18231a] rounded-full w-5 h-5 flex items-center justify-center">2</span>
                  Shipping Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-semibold text-luxury-gray uppercase tracking-widest mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#f6f3f2] border border-[#c4c8c1]/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#18231a] transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-semibold text-luxury-gray uppercase tracking-widest mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    required
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#f6f3f2] border border-[#c4c8c1]/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#18231a] transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-xs font-semibold text-luxury-gray uppercase tracking-widest mb-2">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="address"
                    type="text"
                    required
                    placeholder="Street address or P.O. Box"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#f6f3f2] border border-[#c4c8c1]/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#18231a] transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="apartment" className="block text-xs font-semibold text-luxury-gray uppercase tracking-widest mb-2">
                    Apartment, suite, etc. (optional)
                  </label>
                  <input
                    id="apartment"
                    type="text"
                    placeholder="Apt, suite, unit, building, floor, etc."
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    className="w-full bg-[#f6f3f2] border border-[#c4c8c1]/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#18231a] transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-xs font-semibold text-luxury-gray uppercase tracking-widest mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="city"
                    type="text"
                    required
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#f6f3f2] border border-[#c4c8c1]/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#18231a] transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="shipping-state" className="block text-xs font-semibold text-luxury-gray uppercase tracking-widest mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="shipping-state"
                      value={stateSel}
                      required
                      onChange={(e) => setStateSel(e.target.value)}
                      className="w-full bg-[#f6f3f2] border border-[#c4c8c1]/40 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-[#18231a] transition-all h-[46px]"
                    >
                      <option value="">Select</option>
                      <option value="NY">NY - New York</option>
                      <option value="CA">CA - California</option>
                      <option value="TX">TX - Texas</option>
                      <option value="FR">FR - Île-de-France</option>
                      <option value="UK">UK - London</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="zip" className="block text-xs font-semibold text-luxury-gray uppercase tracking-widest mb-2">
                      ZIP Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="zip"
                      type="text"
                      required
                      placeholder="ZIP"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      className="w-full bg-[#f6f3f2] border border-[#c4c8c1]/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#18231a] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Method Choice */}
              <div className="pt-4">
                <label className="block text-xs font-semibold text-luxury-gray uppercase tracking-widest mb-3">
                  Shipping Method
                </label>
                <div className="space-y-3">
                  <label 
                    onClick={() => setShippingMethod('standard')}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                      shippingMethod === 'standard' 
                        ? 'border-[#18231a] bg-[#FAF9F6] shadow-xs' 
                        : 'border-[#eae7e7] bg-[#f6f3f2] hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="shipping-std"
                        name="shipping_method"
                        checked={shippingMethod === 'standard'}
                        readOnly
                        className="text-[#18231a] focus:ring-[#18231a] w-5 h-5"
                      />
                      <span className="text-sm font-medium text-luxury-charcoal">Standard Editorial (5-7 days)</span>
                    </div>
                    <span className="text-xs text-luxury-gray uppercase font-semibold">Free</span>
                  </label>

                  <label 
                    onClick={() => setShippingMethod('express')}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                      shippingMethod === 'express' 
                        ? 'border-[#18231a] bg-[#FAF9F6] shadow-xs' 
                        : 'border-[#eae7e7] bg-[#f6f3f2] hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        id="shipping-exp"
                        name="shipping_method"
                        checked={shippingMethod === 'express'}
                        readOnly
                        className="text-[#18231a] focus:ring-[#18231a] w-5 h-5"
                      />
                      <span className="text-sm font-medium text-luxury-charcoal">Express Curated (2-3 days)</span>
                    </div>
                    <span className="text-xs text-luxury-gray uppercase font-semibold">{formatINR(EXPRESS_SHIPPING_INR)}</span>
                  </label>
                </div>
              </div>
            </section>

            {/* Step 3: Payment */}
            <section className="space-y-6" id="section-payment">
              <div className="border-b border-gray-100 pb-3">
                <h2 className="font-serif text-xl tracking-tight text-[#18231a] font-medium flex items-center">
                  <span className="font-mono text-xs mr-2 border border-[#18231a] rounded-full w-5 h-5 flex items-center justify-center">3</span>
                  Payment
                </h2>
                <p className="text-xs text-luxury-gray mt-1">All transactions are fully secure and cryptographically encrypted.</p>
              </div>

              <div className="border border-[#eae7e7] rounded-lg overflow-hidden bg-white">
                {/* Credit Card Selector Header */}
                <div 
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${
                    paymentMethod === 'card' ? 'bg-[#f6f3f2]' : 'hover:bg-neutral-50'
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer w-full">
                    <input
                      type="radio"
                      id="pay-card"
                      name="payment_method"
                      checked={paymentMethod === 'card'}
                      readOnly
                      className="text-[#18231a] focus:ring-[#18231a] w-5 h-5"
                    />
                    <span className="text-sm font-semibold text-luxury-charcoal">Credit Card</span>
                  </label>
                  <div className="text-luxury-gray opacity-70">
                    <CreditCard className="h-4 w-4" />
                  </div>
                </div>

                {/* Credit Card inputs (shows when paymentMethod is 'card') */}
                <AnimatePresence initial={false}>
                  {paymentMethod === 'card' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 border-t border-[#eae7e7] bg-white space-y-4">
                        <div>
                          <label htmlFor="card-num" className="block text-[10px] font-bold text-luxury-gray uppercase mb-1.5 tracking-wider">Card Number</label>
                          <input
                            id="card-num"
                            type="text"
                            required={paymentMethod === 'card'}
                            placeholder="Card number"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                            maxLength={19}
                            className="w-full bg-[#f6f3f2] border border-[#c4c8c1]/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#18231a] transition-all"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="card-exp" className="block text-[10px] font-bold text-luxury-gray uppercase mb-1.5 tracking-wider">Expiration Date</label>
                            <input
                              id="card-exp"
                              type="text"
                              required={paymentMethod === 'card'}
                              placeholder="MM/YY"
                              value={expiry}
                              onChange={(e) => setExpiry(e.target.value)}
                              maxLength={5}
                              className="w-full bg-[#f6f3f2] border border-[#c4c8c1]/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#18231a] transition-all"
                            />
                          </div>
                          <div>
                            <label htmlFor="card-cvv" className="block text-[10px] font-bold text-luxury-gray uppercase mb-1.5 tracking-wider">Security Code</label>
                            <input
                              id="card-cvv"
                              type="password"
                              required={paymentMethod === 'card'}
                              placeholder="CVV"
                              value={cvv}
                              onChange={(e) => setCvv(e.target.value)}
                              maxLength={4}
                              className="w-full bg-[#f6f3f2] border border-[#c4c8c1]/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#18231a] transition-all"
                            />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="card-name" className="block text-[10px] font-bold text-luxury-gray uppercase mb-1.5 tracking-wider">Name on Card</label>
                          <input
                            id="card-name"
                            type="text"
                            required={paymentMethod === 'card'}
                            placeholder="Name on card"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            className="w-full bg-[#f6f3f2] border border-[#c4c8c1]/40 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#18231a] transition-all"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* PayPal option */}
                <div 
                  onClick={() => setPaymentMethod('paypal')}
                  className={`p-4 border-t border-[#eae7e7] flex justify-between items-center cursor-pointer transition-colors ${
                    paymentMethod === 'paypal' ? 'bg-[#f6f3f2]' : 'hover:bg-neutral-50'
                  }`}
                >
                  <label className="flex items-center gap-3 cursor-pointer w-full">
                    <input
                      type="radio"
                      id="pay-paypal"
                      name="payment_method"
                      checked={paymentMethod === 'paypal'}
                      readOnly
                      className="text-[#18231a] focus:ring-[#18231a] w-5 h-5"
                    />
                    <span className="text-sm font-semibold text-luxury-charcoal">PayPal</span>
                  </label>
                </div>

                {/* PayPal collapsed state info */}
                <AnimatePresence initial={false}>
                  {paymentMethod === 'paypal' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 border-t border-[#eae7e7] bg-white text-xs text-luxury-gray space-y-2">
                        <p>After clicking "Complete Purchase", you will be securely redirected to PayPal to complete your authorization, after which you will be routed back to GOSH.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>

          {/* RIGHT Column: Order Summary sticky panel */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#eae7e7] shadow-xs space-y-6">
              <h3 className="font-serif text-lg text-luxury-charcoal pb-4 border-b border-[#eae7e7] font-medium">
                Order Summary
              </h3>

              {/* Item row list */}
              <div className="space-y-6 max-h-96 overflow-y-auto pr-1">
                {activeItems.map((item, index) => (
                  <div key={`${item.product.id}-${item.selectedSize}`} className="flex gap-4 items-center">
                    <div className="w-16 h-20 bg-[#f6f3f2] rounded overflow-hidden flex-shrink-0 relative border border-gray-100">
                      <img
                        alt={item.product.title}
                        src={item.product.image}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-top"
                      />
                      <span className="absolute -top-1.5 -right-1.5 bg-luxury-gray text-white w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-semibold border border-white">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-grow text-left">
                      <h4 className="text-xs font-semibold text-luxury-charcoal leading-tight truncate max-w-[150px]">
                        {item.product.title}
                      </h4>
                      <p className="text-[11px] text-luxury-gray mt-1 font-mono uppercase tracking-wider">
                        {item.product.brand} • Size {item.selectedSize}
                      </p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-xs font-mono font-medium text-luxury-charcoal">
                        {formatINR(item.product.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Discount code application inside summary */}
              <div className="border-t border-[#eae7e7] pt-5">
                <div className="flex gap-2">
                  <input
                    id="checkout-coupon"
                    type="text"
                    placeholder="Discount code or gift card"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full bg-[#f6f3f2] border border-[#c4c8c1]/35 rounded-lg px-3 py-2 text-xs uppercase tracking-wider focus:outline-none focus:border-[#18231a] placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-[#eae7e7] text-luxury-charcoal font-semibold text-xs tracking-wider rounded-lg hover:bg-[#dcd9d9] transition-colors uppercase shrink-0"
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <p className="text-[10px] text-red-600 mt-2 italic text-left">{promoError}</p>
                )}
              </div>

              {/* Itemized Calculation Totals */}
              <div className="space-y-3 pt-4 border-t border-[#eae7e7] text-xs text-luxury-gray">
                
                {/* Subtotal */}
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-luxury-charcoal font-semibold font-mono">{formatINR(subtotal)}</span>
                </div>

                {/* Discount display */}
                {appliedDiscount && (
                  <div className="flex justify-between items-center text-emerald-800 bg-emerald-50 px-2 py-1.5 rounded border border-emerald-100">
                    <span className="flex items-center text-[11px]">
                      <Ticket className="h-3.5 w-3.5 mr-1" />
                      CODE: {appliedDiscount.code} (-{appliedDiscount.percent}%)
                    </span>
                    <button
                      type="button"
                      onClick={() => setAppliedDiscount(null)}
                      className="text-red-500 hover:text-red-700 font-bold ml-1.5"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {appliedDiscount && (
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <span className="text-emerald-700 font-mono font-bold">-{formatINR(discountVal)}</span>
                  </div>
                )}

                {/* Shipping cost recalculates dynamically */}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-luxury-charcoal font-semibold">
                    {shippingCost === 0 ? <strong className="text-emerald-700">Free</strong> : formatINR(shippingCost)}
                  </span>
                </div>

                {/* Taxes dynamic */}
                <div className="flex justify-between">
                  <span>GST (12%)</span>
                  <span className="text-luxury-charcoal font-semibold font-mono">{formatINR(tax)}</span>
                </div>

                {/* Grand Total */}
                <div className="flex justify-between items-end pt-4 mt-2 border-t border-[#eae7e7] text-luxury-charcoal">
                  <span className="font-serif text-base font-medium">Total</span>
                  <div className="text-right flex items-baseline">
                    <span className="text-[10px] text-luxury-gray uppercase mr-1.5 font-sans">INR</span>
                    <span className="font-serif text-xl font-bold">{formatINR(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Complete Purchase CTA action button */}
              <button
                type="submit"
                disabled={isLatching}
                className="w-full mt-6 py-4 bg-[#18231a] text-white rounded-full font-semibold text-xs tracking-widest hover:bg-[#2d392f] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-85 shadow-md"
              >
                {isLatching ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Securing Transaction...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Purchase</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="text-center text-[11px] text-luxury-gray pt-2 flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                <span>Guaranteed safe & secure checkout</span>
              </div>
            </div>
          </div>
        </form>
      </main>

      {/* Styled Simplified Footer exclusively rendered during checkout as requested */}
      <footer className="w-full px-6 py-14 flex flex-col items-center border-t border-[#eae7e7] bg-[#f6f3f2] mt-auto">
        <div className="font-serif text-lg tracking-tight text-[#18231a] font-semibold mb-6">GOSH</div>
        <ul className="flex gap-6 mb-6 text-xs text-luxury-gray uppercase tracking-widest font-mono">
          <li>
            <button 
              type="button" 
              onClick={() => alert("DHL complimentary eco carbon-neutral shipping handles dispatch.")} 
              className="hover:text-luxury-charcoal transition-colors underline"
            >
              Shipping
            </button>
          </li>
          <li>
            <button 
              type="button" 
              onClick={() => alert("Complimentary returns authorized within 14 calendar days.")} 
              className="hover:text-luxury-charcoal transition-colors underline"
            >
              Returns
            </button>
          </li>
          <li>
            <button 
              type="button" 
              onClick={() => alert("Your dynamic identity values are cryptographically safeguarded.")} 
              className="hover:text-luxury-charcoal transition-colors underline"
            >
              Privacy
            </button>
          </li>
          <li>
            <button 
              type="button" 
              onClick={() => alert("Purchase terms conform to ethical luxury preservation codes.")} 
              className="hover:text-luxury-charcoal transition-colors underline"
            >
              Terms
            </button>
          </li>
        </ul>
        <p className="text-xs text-luxury-gray">
          &copy; {new Date().getFullYear()} GOSH. Ethically Curated.
        </p>
      </footer>

      {/* High-fidelity custom success confirmation modal dialog block */}
      <AnimatePresence>
        {isSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden p-4">
            {/* Modal Backdrop overlay overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={handleSuccessClose}
              className="fixed inset-0 bg-black"
            />
            
            {/* Success card modal content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white text-luxury-charcoal max-w-md w-full border border-gray-100 p-8 shadow-2xl relative z-10 text-center space-y-6 rounded-2xl"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
                <Check className="h-7 w-7" />
              </div>

              <div className="space-y-2">
                <p className="font-mono text-[9px] tracking-[0.25em] text-emerald-700 uppercase font-bold">
                  GOSH DISPATCH SECURED
                </p>
                <h3 className="font-serif text-2xl tracking-wide text-luxury-charcoal uppercase">
                  Thank You For Circulating
                </h3>
                <p className="font-sans text-xs text-luxury-gray leading-relaxed max-w-xs mx-auto">
                  Your carbon-offset shipping label has been allocated. Our Parisian workshop is initiating final inspection, authentication review, and organic restoration grading.
                </p>
              </div>

              {/* Eco-Logistics itemized certificate card */}
              <div className="bg-[#FAF9F6] border border-gray-200/50 p-4 rounded-xl text-left font-mono text-[10px] space-y-2 text-luxury-gray">
                <div className="flex justify-between">
                  <span>Eco-Logistics ID:</span>
                  <span className="text-[#18231a] font-semibold">{generatedId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Carbon Compensation:</span>
                  <span className="text-emerald-700 font-semibold">-14.2 kg CO₂ Offset</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200/60 text-luxury-charcoal font-medium">
                  <span>Total Debit Amount:</span>
                  <span className="font-sans font-bold text-xs">{formatINR(grandTotal)}</span>
                </div>
              </div>

              <button
                type="button"
                id="checkout-track-btn"
                onClick={() => {
                  setIsSuccess(false);
                  if (!isDemo) {
                    onClearCart();
                  }
                  setView('tracking');
                }}
                className="w-full bg-[#18231a] font-semibold text-xs tracking-widest text-[#FAF9F6] py-4 rounded-full uppercase hover:bg-[#2d392f] transition-all shadow-md"
              >
                Track Your Eco-Shipment Now
              </button>

              <button
                type="button"
                id="checkout-close-success"
                onClick={handleSuccessClose}
                className="w-full bg-transparent border border-gray-300 font-semibold text-[11px] tracking-widest text-luxury-charcoal py-3 rounded-full uppercase hover:bg-neutral-50 transition-all"
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
