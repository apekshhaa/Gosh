import React, { useState } from 'react';
import { ViewState } from '../types';
import { Shield, Sparkles, Sprout, ArrowLeft, HeartHandshake, EyeOff, Globe } from 'lucide-react';

interface PrivacyViewProps {
  setView: (view: ViewState) => void;
}

export default function PrivacyView({ setView }: PrivacyViewProps) {
  const [activeTab, setActiveTab] = useState<'eco' | 'privacy'>('eco');

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
          <p className="font-mono text-[10px] tracking-[0.25em] text-luxury-gray uppercase mb-3 text-center">
            Ethics, Sustainability & Protection
          </p>
          <h1 className="font-serif text-3xl leading-tight text-luxury-charcoal uppercase tracking-[0.05em] md:text-5xl mb-6">
            Eco Charter & Client Trust
          </h1>
          <p className="font-sans text-sm leading-relaxed text-luxury-gray md:text-base mb-10 max-w-2xl mx-auto">
            Our dual priorities remain: absolute ecological circularity of rare clothing crafts and state-of-the-art protection of collector transactional data.
          </p>

          {/* Toggle Tabs */}
          <div className="inline-flex border-b border-[#eae7e7] w-full max-w-md justify-center">
            <button
              onClick={() => setActiveTab('eco')}
              className={`pb-4 px-6 text-xs font-semibold uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'eco'
                  ? 'text-luxury-charcoal font-bold border-b-2 border-luxury-charcoal'
                  : 'text-luxury-gray hover:text-luxury-charcoal'
              }`}
            >
              Eco Charter
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`pb-4 px-6 text-xs font-semibold uppercase tracking-widest transition-all cursor-pointer ${
                activeTab === 'privacy'
                  ? 'text-luxury-charcoal font-bold border-b-2 border-luxury-charcoal'
                  : 'text-luxury-gray hover:text-luxury-charcoal'
              }`}
            >
              Privacy Policy
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'eco' ? (
          /* Eco Charter Content */
          <div className="space-y-16 animate-fadeIn">
            {/* Bento Values Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white border border-[#eae7e7] p-8 rounded-2xl text-left">
                <Sprout className="h-6 w-6 text-[#243e2b] mb-4" />
                <h3 className="font-serif text-lg text-luxury-charcoal uppercase tracking-wider mb-2">100% Circular Goal</h3>
                <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
                  We guarantee zero-waste curation. Every vintage garment is restored, handled, and delivered using organic cleaners, strictly avoiding fabric landfill contamination.
                </p>
              </div>

              <div className="bg-white border border-[#eae7e7] p-8 rounded-2xl text-left">
                <Globe className="h-6 w-6 text-[#243e2b] mb-4" />
                <h3 className="font-serif text-lg text-luxury-charcoal uppercase tracking-wider mb-2">Carbon Offset Sourcing</h3>
                <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
                  Every courier and freighter leg of our sourcing network is fully carbon-neutral, verified in tandem with climate preservation projects globally.
                </p>
              </div>

              <div className="bg-white border border-[#eae7e7] p-8 rounded-2xl text-left">
                <Sparkles className="h-6 w-6 text-[#243e2b] mb-4" />
                <h3 className="font-serif text-lg text-luxury-charcoal uppercase tracking-wider mb-2">Gentle Fiber Restoration</h3>
                <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
                  We specialize in non-destructive ozone and steam sanitization. This processes delicate fabrics like silk, cashmere, and hand-woven wool without any harsh synthetics.
                </p>
              </div>
            </div>

            {/* Detailed Manifesto Statement */}
            <div className="bg-white border border-[#eae7e7] px-8 py-10 md:p-12 rounded-3xl text-left space-y-6">
              <h3 className="font-serif text-xl md:text-2xl text-luxury-charcoal uppercase tracking-wide border-b border-[#f3eee9] pb-4">
                The GOSH Circularity Manifesto
              </h3>
              <div className="space-y-4 font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
                <p>
                  Fast fashion has transformed custom clothing from a generational investment into a transient commodity. The consequences can be measured in ruined ecosystems and exploited labor. GOSH was founded to oppose this trajectory, celebrating the structural artistry of historic haute couture.
                </p>
                <p>
                  Our collectors are partners in circular preservation. By choosing vintage and pre-loved garments from legacy fashion houses, you preserve original creative legacies, divert fabrics from trash heaps, and cut resource demands. In fact, acquiring one certified GOSH blazer represents a average reduction of over 25 kilograms of carbon emissions and thousands of liters of fresh water compared to new luxury production.
                </p>
                <p>
                  We are caretakers of clothing culture. This Eco Charter guides every policy—from our premium packaging boxes to our carbon-neutral logistics and premium chemical-free atelier sanitations.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Privacy Policy Content */
          <div className="space-y-16 animate-fadeIn">
            {/* Grid of Key Commitments */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white border border-[#eae7e7] p-8 rounded-2xl text-left">
                <Shield className="h-6 w-6 text-luxury-charcoal mb-4" />
                <h3 className="font-serif text-lg text-luxury-charcoal uppercase tracking-wider mb-2">State-Of-The-Art Security</h3>
                <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
                  We secure authentication vectors using verified client tokens. Payments are executed directly through PCI-DSS Level 1 payment servers to keep your bank details confidential.
                </p>
              </div>

              <div className="bg-white border border-[#eae7e7] p-8 rounded-2xl text-left">
                <EyeOff className="h-6 w-6 text-luxury-charcoal mb-4" />
                <h3 className="font-serif text-lg text-luxury-charcoal uppercase tracking-wider mb-2">Client Confidentiality</h3>
                <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
                  We never lease or sell your client parameters (names, addresses, shopping records) to advertising aggregators. Your activity on our platform remains strictly confidential.
                </p>
              </div>

              <div className="bg-white border border-[#eae7e7] p-8 rounded-2xl text-left">
                <HeartHandshake className="h-6 w-6 text-luxury-charcoal mb-4" />
                <h3 className="font-serif text-lg text-luxury-charcoal uppercase tracking-wider mb-2">Right to Erasure</h3>
                <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
                  You retain complete ownership over your identity. You may clear your registered account information instantly through your profile dashboard, erasing your archive trace permanently.
                </p>
              </div>
            </div>

            {/* In Depth Privacy Document */}
            <div className="bg-white border border-[#eae7e7] px-8 py-10 md:p-12 rounded-3xl text-left space-y-6">
              <h3 className="font-serif text-xl md:text-2xl text-luxury-charcoal uppercase tracking-wide border-b border-[#f3eee9] pb-4">
                Data Transparency Statement (GDPR/CCPA Compliant)
              </h3>
              <div className="space-y-4 font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
                <h4 className="font-serif text-sm font-semibold text-luxury-charcoal uppercase tracking-wider">1. Collected Parameters</h4>
                <p>
                  To deliver pristine vintage pieces to your doorstep, we manage your secure login tokens, email contact registries (specifically for archive alerts), shipping and custom references, and transaction logs. This information is processed exclusively to coordinate logistics and authentication updates.
                </p>
                <h4 className="font-serif text-sm font-semibold text-luxury-charcoal uppercase tracking-wider">2. Cookie Policy</h4>
                <p>
                  We rely entirely on functional, local key-value state trackers (e.g. LocalStorage) to persist your personal wishlist items, customized cart allocations, and authentication profiles across browsers. We do not place behavior tracking pixels or cross-site tracking cookies.
                </p>
                <h4 className="font-serif text-sm font-semibold text-luxury-charcoal uppercase tracking-wider">3. Third Party Disclosures</h4>
                <p>
                  Identity markers are shared only with our trusted, carbon-neutral fulfillment carriers (DHL, FedEx) to guarantee accurate door delivery, and with certified payment processors (Stripe/PayPal) during order fulfillment checkout.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
