import React, { useState } from 'react';
import { ViewState } from '../types';
import { RefreshCcw, ShieldCheck, FileText, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';

interface ReturnsViewProps {
  setView: (view: ViewState) => void;
}

export default function ReturnsView({ setView }: ReturnsViewProps) {
  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState('sizing');
  const [comments, setComments] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      setError('Please provide a valid order reference number.');
      return;
    }
    if (!agreeTerms) {
      setError('You must confirm that the original archival tag remains attached and the item is unworn.');
      return;
    }

    setError('');
    setIsSubmitted(true);
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b] min-h-screen font-sans">
      <main className="max-w-7xl mx-auto px-6 py-12 md:px-12 md:py-20">
        {/* Navigation Breadcrumb */}
        <div className="mb-8 text-left">
          <button
            onClick={() => setView('shop')}
            className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-luxury-gray hover:text-luxury-charcoal transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Shop
          </button>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="font-mono text-[10px] tracking-[0.25em] text-luxury-gray uppercase mb-3">
            Circular Return Standards & Exchanges
          </p>
          <h1 className="font-serif text-3xl leading-tight text-luxury-charcoal uppercase tracking-[0.05em] md:text-5xl mb-6">
            The Refund Registry
          </h1>
          <p className="font-sans text-sm leading-relaxed text-luxury-gray md:text-base">
            True luxury operates in cycles. To prolong the longevity of historical high-fashion and minimize transport footprints, we curate a seamless, circular return structure.
          </p>
        </div>

        {/* Policies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white border border-[#eae7e7] p-8 rounded-2xl text-left">
            <RefreshCcw className="h-6 w-6 text-luxury-charcoal mb-4" />
            <h3 className="font-serif text-lg text-luxury-charcoal uppercase tracking-wider mb-2">14-Day Cycle</h3>
            <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
              We accept returns within 14 days of your delivery date. All returned pieces are issued as immediate Store Credit or direct exchange, protecting the continuous cycle of curation.
            </p>
          </div>

          <div className="bg-white border border-[#eae7e7] p-8 rounded-2xl text-left">
            <ShieldCheck className="h-6 w-6 text-luxury-charcoal mb-4" />
            <h3 className="font-serif text-lg text-luxury-charcoal uppercase tracking-wider mb-2">Tag Integrity</h3>
            <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
              For security, the physical "GOSH" metallic thread archival tag must remain tightly sealed. Removal of this serial tag renders the item ineligible for circular return.
            </p>
          </div>

          <div className="bg-white border border-[#eae7e7] p-8 rounded-2xl text-left">
            <FileText className="h-6 w-6 text-luxury-charcoal mb-4" />
            <h3 className="font-serif text-lg text-luxury-charcoal uppercase tracking-wider mb-2">Pristine State</h3>
            <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
              The item must reside exactly in its checked conditions: unworn, unwashed, and neatly nested within its original packaging boxes and protective muslin sheets.
            </p>
          </div>
        </div>

        {/* Interactive Return Form Split */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mt-6 items-start">
          {/* Detailed instruction narrative list */}
          <div className="md:col-span-5 text-left space-y-6">
            <div className="space-y-2">
              <p className="font-mono text-[9px] tracking-[0.25em] text-luxury-gray uppercase">Step-By-Step Return Registry</p>
              <h2 className="font-serif text-2xl md:text-3xl text-luxury-charcoal uppercase tracking-wide">How To Initiate A Refund or Exchange</h2>
            </div>
            
            <ol className="space-y-6 list-decimal list-inside font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
              <li className="pl-2">
                <span className="font-semibold text-luxury-charcoal uppercase font-serif tracking-wider ml-1">Submit Registry Inquiry:</span> Use our private form to feed your order reference ID and trigger authentication.
              </li>
              <li className="pl-2">
                <span className="font-semibold text-luxury-charcoal uppercase font-serif tracking-wider ml-1">Receive Eco Label:</span> Once authenticated, you will immediately receive a pre-paid carbon-neutral digital shipping stamp.
              </li>
              <li className="pl-2">
                <span className="font-semibold text-luxury-charcoal uppercase font-serif tracking-wider ml-1">Schedule Courier Pickup:</span> Package the accessory or coat back inside its muslin, seal the box, and schedule a complementary home pickup.
              </li>
              <li className="pl-2">
                <span className="font-semibold text-luxury-charcoal uppercase font-serif tracking-wider ml-1">Store Credit Issuance:</span> Once checked back into Paris or Milan, your premium store credit is digitally signed to your profile.
              </li>
            </ol>
          </div>

          {/* Core Interactive Portal */}
          <div className="md:col-span-7 bg-white border border-[#eae7e7] rounded-3xl p-8 md:p-12 shadow-sm">
            {isSubmitted ? (
              <div className="text-center py-10 space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-700 animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif text-xl md:text-2xl text-luxury-charcoal uppercase tracking-wide">Inquiry Registered</h3>
                  <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed max-w-md mx-auto">
                    Thank you. Your request for order <span className="font-mono text-luxury-charcoal font-bold">{orderId}</span> has been securely logged. An audit team member will sign your pre-paid courier label to your inbox within 12 business hours.
                  </p>
                </div>
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="bg-transparent border border-luxury-charcoal text-luxury-charcoal font-semibold text-xs tracking-widest px-6 py-3 rounded-full hover:bg-neutral-50 uppercase transition-all"
                >
                  Register Another Order
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 text-left">
                <h3 className="font-serif text-base text-luxury-charcoal uppercase tracking-wider font-semibold border-b border-[#f3eee9] pb-4">
                  Registry Portal
                </h3>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-800 text-xs rounded-xl p-4 font-sans leading-relaxed">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="order-id-input" className="block font-mono text-[10px] tracking-widest text-luxury-gray uppercase">
                    Order Reference Number
                  </label>
                  <input
                    id="order-id-input"
                    type="text"
                    required
                    maxLength={25}
                    placeholder="e.g. CL-849201A"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#eae7e7] rounded-xl py-3 px-4 font-mono text-xs uppercase text-luxury-charcoal focus:outline-none focus:ring-1 focus:ring-luxury-charcoal"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="reason-select" className="block font-mono text-[10px] tracking-widest text-luxury-gray uppercase">
                    Inquiry Category
                  </label>
                  <select
                    id="reason-select"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#eae7e7] rounded-xl py-3 px-4 font-sans text-xs text-luxury-charcoal focus:outline-none focus:ring-1 focus:ring-luxury-charcoal"
                  >
                    <option value="sizing">Sizing & Measurement Discrepancy</option>
                    <option value="unsuited">Aesthetic Preference Exchange</option>
                    <option value="condition">Inexact Condition Presentation</option>
                    <option value="other">Other Inquiries</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="comments-input" className="block font-mono text-[10px] tracking-widest text-luxury-gray uppercase">
                    Additional Comments & Notes (Optional)
                  </label>
                  <textarea
                    id="comments-input"
                    rows={4}
                    placeholder="Detail any specifics that our concierge should audit..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    className="w-full bg-[#FAF9F6] border border-[#eae7e7] rounded-xl py-3 px-4 font-sans text-xs text-luxury-charcoal focus:outline-none focus:ring-1 focus:ring-luxury-charcoal resize-none"
                  />
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input
                    id="agree-terms-checkbox"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-[#eae7e7] text-luxury-charcoal focus:ring-1 focus:ring-luxury-charcoal cursor-pointer"
                  />
                  <label htmlFor="agree-terms-checkbox" className="font-sans text-xs text-luxury-gray leading-relaxed cursor-pointer select-none">
                    I confirm that the metallic thread "GOSH" serial tag remains sealed on the garment, and it resides in its immaculate hand-balanced original form.
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#18231a] text-white font-semibold text-xs tracking-widest py-4 rounded-xl hover:bg-neutral-800 uppercase transition-all cursor-pointer"
                >
                  Submit Registry Return <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
