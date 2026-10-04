import React from 'react';
import { ViewState } from '../types';
import { Truck, ShieldCheck, Globe, Clock, ArrowLeft, Anchor, ArrowRight } from 'lucide-react';
import { editorialImages } from '../images';

interface ShippingViewProps {
  setView: (view: ViewState) => void;
}

export default function ShippingView({ setView }: ShippingViewProps) {
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

        {/* Hero Banner Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="font-mono text-[10px] tracking-[0.25em] text-luxury-gray uppercase mb-3">
            Concious Logistics & Courier Partnerships
          </p>
          <h1 className="font-serif text-3xl leading-tight text-luxury-charcoal uppercase tracking-[0.05em] md:text-5xl mb-6">
            Shipping & Customs Charter
          </h1>
          <p className="font-sans text-sm leading-relaxed text-luxury-gray md:text-base">
            We operate fully carbon-neutral logistics routes, preserving original heritage materials using premium, plastic-free custom archives and hand-wrapped muslin.
          </p>
        </div>

        {/* Methods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Method 1 */}
          <div className="bg-white border border-[#eae7e7] p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left">
            <div className="w-12 h-12 rounded-full bg-emerald-50/50 border border-emerald-100 flex items-center justify-center mb-6 text-luxury-charcoal">
              <Truck className="w-5 h-5 text-emerald-800" />
            </div>
            <h3 className="font-serif text-lg text-luxury-charcoal uppercase tracking-wider mb-2">Domestic Ground</h3>
            <p className="font-mono text-xs tracking-wider text-emerald-800 font-bold mb-4">COMPLIMENTARY OVER ₹20,800</p>
            <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed mb-4">
              Carbon-neutral standard transit. Orders inside France, Italy, and UK are fulfilled via green fleets and electric final-mile carriers.
            </p>
            <span className="font-mono text-[11px] tracking-widest text-[#1c1b1b] uppercase">3 - 5 Business Days</span>
          </div>

          {/* Method 2 */}
          <div className="bg-white border border-[#eae7e7] p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left">
            <div className="w-12 h-12 rounded-full bg-orange-50/50 border border-orange-100 flex items-center justify-center mb-6 text-luxury-charcoal">
              <Clock className="w-5 h-5 text-orange-800" />
            </div>
            <h3 className="font-serif text-lg text-luxury-charcoal uppercase tracking-wider mb-2">Expedited Courier</h3>
            <p className="font-mono text-xs tracking-wider text-luxury-gray mb-4">DYNAMIC AT CHECKOUT</p>
            <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed mb-4">
              Premium premium packing. Prioritizes next-available flight pathways and express ground priority. Hand-delivered in protective muslin cases.
            </p>
            <span className="font-mono text-[11px] tracking-widest text-[#1c1b1b] uppercase">1 - 2 Business Days</span>
          </div>

          {/* Method 3 */}
          <div className="bg-white border border-[#eae7e7] p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-left">
            <div className="w-12 h-12 rounded-full bg-stone-50/50 border border-[#eae7e7] flex items-center justify-center mb-6 text-luxury-charcoal">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-lg text-luxury-charcoal uppercase tracking-wider mb-2">Global Archive Link</h3>
            <p className="font-mono text-xs tracking-wider text-luxury-gray mb-4">FLAT ₹2,900 STANDARD</p>
            <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed mb-4">
              Worldwide delivery. Handled by specialty custom brokers to minimize hold-ups and ensure immediate delivery direct to your residence.
            </p>
            <span className="font-mono text-[11px] tracking-widest text-[#1c1b1b] uppercase">5 - 10 Business Days</span>
          </div>
        </div>

        {/* Informative Editorial Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 bg-white border border-[#eae7e7] rounded-3xl p-8 md:p-12 mb-16 items-center">
          <div className="text-left space-y-6">
            <div className="space-y-2">
              <p className="font-mono text-[9px] tracking-[0.25em] text-luxury-gray uppercase">Border Crossing Declarations</p>
              <h2 className="font-serif text-2xl md:text-3xl text-luxury-charcoal uppercase tracking-wide">Customs & Duties Information</h2>
            </div>
            <div className="space-y-4 font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
              <p>
                All archival garments ship directly from our preservation vaults in Paris or Milan. Orders arriving inside the European Union are exempt from border customs fees.
              </p>
              <p>
                For international collectors located in North America, Asia, and Oceania, your order may be subject to local import taxes and custom clearance charges imposed by your border control. We pre-render standard customized custom declaration forms containing exact historic clothing classification markers to ensure minimal delay and reduce unforeseen fees.
              </p>
              <p className="font-semibold text-luxury-charcoal">
                Need specialized assistance regarding customs? Contact our Private Concierge Desk for custom tariff support prior to shipment.
              </p>
            </div>
            <button
              onClick={() => setView('contact')}
              className="inline-flex items-center gap-2 font-mono text-[11px] font-bold tracking-widest uppercase hover:underline underline-offset-4"
            >
              Consult Broker Concierge <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="aspect-[4/3] bg-luxury-sand/40 rounded-2xl overflow-hidden shadow-lg">
            <img
              alt="Archival Packaging Box"
              className="w-full h-full object-cover grayscale-[10%]"
              src={editorialImages.shipping}
            />
          </div>
        </div>

        {/* Security and Packaging Assurances */}
        <div className="border-t border-[#eae7e7] pt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4 text-left">
              <div className="flex-shrink-0 mt-1">
                <ShieldCheck className="h-6 w-6 text-luxury-charcoal" />
              </div>
              <div>
                <h4 className="font-serif text-base text-luxury-charcoal uppercase tracking-wider font-semibold mb-2">100% Insured Delivery</h4>
                <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
                  Every vintage artifact is completely protected up to its declared archival value during the entire shipping journey. In the highly uncommon event of damage or loss, we guarantee immediate credit or expedited reclamation.
                </p>
              </div>
            </div>

            <div className="flex gap-4 text-left">
              <div className="flex-shrink-0 mt-1">
                <Anchor className="h-6 w-6 text-luxury-charcoal" />
              </div>
              <div>
                <h4 className="font-serif text-base text-luxury-charcoal uppercase tracking-wider font-semibold mb-2">Eco Preservation Packaging</h4>
                <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
                  We use biodegradable high-density recycled fiber boxes and authentic cotton archival garment bags designed to filter humidity. No plastic mailers or single-use tapes will ever touch your garment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
