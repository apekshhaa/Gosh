import React from 'react';
import { ViewState } from '../types';
import { Diamond, Hourglass, Globe2, ArrowRight } from 'lucide-react';
import { editorialImages } from '../images';

interface AboutViewProps {
  setView: (view: ViewState) => void;
}

export default function AboutView({ setView }: AboutViewProps) {
  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b] min-h-screen font-sans">
      {/* Hero Narrative Section */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
          <div className="md:col-span-5 md:col-start-1 text-left">
            <p className="font-mono text-[10px] tracking-[0.25em] text-luxury-gray uppercase mb-4">
              Our Vision & Philosophy
            </p>
            <h1 className="font-serif text-3xl leading-tight text-luxury-charcoal uppercase tracking-[0.05em] md:text-5xl mb-6">
              Reimagining the Lifecycle of Elegance.
            </h1>
            <p className="font-sans text-sm leading-relaxed text-luxury-gray md:text-base mb-8">
              GOSH gives pre-loved clothes another chance to be loved. Browse our finds, or get in touch to list your own clothes for someone else to discover. Every piece has a story, and together we can help it continue.
            </p>
            <button
              onClick={() => setView('shop')}
              className="group inline-flex items-center gap-2 bg-[#18231a] text-[#FAF9F6] px-6 py-3.5 text-xs font-semibold tracking-widest uppercase transition-all hover:bg-[#2d392f] rounded-full"
            >
              Explore GOSH Archives
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a href="https://wa.me/917338546697?text=Hi%20GOSH%2C%20I%E2%80%99d%20like%20to%20list%20clothes%20for%20sale." target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center rounded-full border border-luxury-charcoal px-6 py-3 text-xs font-semibold tracking-widest text-luxury-charcoal uppercase transition-colors hover:bg-[#18231a] hover:text-white">Sell with GOSH</a>
          </div>
          
          <div className="md:col-span-6 md:col-start-7">
            <div className="w-full aspect-[4/5] bg-luxury-sand/50 rounded-2xl overflow-hidden relative shadow-2xl">
              <img
                alt="Sustainable Fashion Narrative"
                className="w-full h-full object-cover grayscale-[15%] hover:scale-105 transition-transform duration-700 ease-out"
                referrerPolicy="no-referrer"
                src={editorialImages.aboutHero}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-20 border-t border-[#eae7e7]">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          {/* Staggered Image Gallery */}
          <div className="w-full md:w-1/2 flex gap-4 relative">
            <div className="w-1/2 pt-12">
              <div className="aspect-[3/4] bg-luxury-sand/50 rounded-2xl overflow-hidden shadow-lg border border-luxury-border/40">
                <img
                  alt="Editorial Detail Shot"
                  className="w-full h-full object-cover grayscale-[10%]"
                  src={editorialImages.aboutCraft}
                />
              </div>
            </div>
            <div className="w-1/2">
              <div className="aspect-[3/4] bg-luxury-sand/50 rounded-2xl overflow-hidden shadow-lg border border-luxury-border/40">
                <img
                  alt="Founder Portrait"
                  className="w-full h-full object-cover grayscale-[10%]"
                  src={editorialImages.aboutAtelier}
                />
              </div>
            </div>
          </div>
          
          {/* Text Content */}
          <div className="w-full md:w-1/2 md:pl-12 text-left space-y-6">
            <p className="font-mono text-[10px] tracking-[0.25em] text-luxury-gray uppercase">
              The Atelier Chronicles
            </p>
            <h2 className="font-serif text-3xl tracking-wide text-luxury-charcoal uppercase">
              Our Story
            </h2>
            <div className="space-y-4 font-sans text-sm md:text-base text-luxury-gray leading-relaxed">
              <p>
                GOSH brings together pre-loved clothes and people looking for their next favourite piece. Sellers can message us to ask about listing their clothes, and shoppers can browse what is currently available.
              </p>
              <p>
                GOSH is a place to shop pre-loved clothes, and other people can sell their own pieces here too. Message us to learn how to list an item. By connecting sellers and shoppers, we are building a community that values quality over quantity and gives good clothes a longer life.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section (Bento Style) */}
      <section className="mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-20">
        <div className="bg-[#FAF9F6] border border-[#eae7e7] rounded-3xl py-12 px-6 md:py-16 md:px-12">
          <div className="text-center mb-12">
            <p className="font-mono text-[10px] tracking-[0.25em] text-luxury-gray uppercase mb-3">
              Principles & Anchors
            </p>
            <h2 className="font-serif text-2xl md:text-3xl text-luxury-charcoal uppercase tracking-wider mb-4">
              Core Values
            </h2>
            <p className="font-sans text-xs md:text-sm text-luxury-gray max-w-2xl mx-auto leading-relaxed">
              A few simple ideas guide the way we share pre-loved clothing.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Value 1 */}
            <div className="bg-[#fcf9f8] border border-luxury-border/50 rounded-2xl p-8 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-orange-50/50 border border-orange-100 flex items-center justify-center mb-6 text-luxury-charcoal">
                <Diamond className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-luxury-charcoal uppercase tracking-wider mb-3">Quality</h3>
              <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
                We share the product photos and details available for each listing. If you need another angle or more information, contact us before ordering.
              </p>
            </div>

            {/* Value 2 */}
            <div className="bg-[#fcf9f8] border border-luxury-border/50 rounded-2xl p-8 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-stone-50/50 border border-[#eae7e7] flex items-center justify-center mb-6 text-luxury-charcoal">
                <Hourglass className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-luxury-charcoal uppercase tracking-wider mb-3">Longevity</h3>
              <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
                Pre-loved clothing can be passed on and enjoyed by someone new. Browse the current collection to see what is available.
              </p>
            </div>

            {/* Value 3 */}
            <div className="bg-[#fcf9f8] border border-luxury-border/50 rounded-2xl p-8 flex flex-col items-center text-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-emerald-50/50 border border-emerald-100 flex items-center justify-center mb-6 text-luxury-charcoal">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-luxury-charcoal uppercase tracking-wider mb-3">Ethics</h3>
              <p className="font-sans text-xs md:text-sm text-luxury-gray leading-relaxed">
                We aim to be clear about listed prices and sizing notes. Shipping and availability are confirmed with you before an order is final.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
