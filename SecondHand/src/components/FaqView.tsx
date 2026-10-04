import React, { useState } from 'react';
import { ViewState } from '../types';
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FaqViewProps {
  setView: (view: ViewState) => void;
}

interface FaqItem {
  id: string;
  category: 'shipping' | 'returns' | 'sizing' | 'quality';
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'ship-cost',
    category: 'shipping',
    question: 'How are shipping costs calculated?',
    answer: 'We offer complimentary carbon-neutral shipping on all domestic orders exceeding ₹20,800. For smaller orders or international shipments, rates are dynamically calculated at checkout based on parcel weight and destination to ensure fair, transparent pricing.'
  },
  {
    id: 'ship-intl',
    category: 'shipping',
    question: 'Do you ship internationally?',
    answer: 'Yes, we ship globally using curated logistics partners committed to sustainable practices. Please note that international recipients are responsible for any applicable customs duties or import taxes levied by their local authorities.'
  },
  {
    id: 'return-policy',
    category: 'returns',
    question: 'What is your return policy?',
    answer: 'Given the unique, secondhand nature of our garments, we accept returns within 14 days of delivery for store credit only. Garments must remain unworn, unwashed, and have the original GOSH archival tag securely attached.'
  },
  {
    id: 'sizing-vintage',
    category: 'sizing',
    question: 'How do you define sizing for vintage pieces?',
    answer: 'Vintage sizing often differs drastically from modern standards. We provide exact flat measurements (chest, length, sleeve) for every garment in its listing description. We strongly advise comparing these measurements against a similar garment you already own rather than relying on the tag size.'
  },
  {
    id: 'auth-quality',
    category: 'quality',
    question: 'How do you ensure the authenticity and quality of garments?',
    answer: 'Every piece undergoes a rigorous, multi-point authentication and condition grading process by our in-house experts. Any minor flaws inherent to the garment\'s history are explicitly documented and photographed. We only accept items that meet our standard for "excellent" or "pristine" archival condition.'
  }
];

const CATEGORIES = [
  { id: 'all', label: 'All Topics' },
  { id: 'shipping', label: 'Shipping & Delivery' },
  { id: 'returns', label: 'Returns & Exchanges' },
  { id: 'sizing', label: 'Sizing & Fit' },
  { id: 'quality', label: 'Quality & Curation' }
];

export default function FaqView({ setView }: FaqViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    'ship-cost': true // default open the first one for high-fidelity interactive feel
  });

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredItems = FAQ_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b] min-h-screen font-sans">
      <main className="max-w-7xl mx-auto px-6 py-12 md:px-12 md:py-20 flex flex-col items-center">
        {/* Hero Section */}
        <div id="faq-hero" className="text-center max-w-3xl mb-16 w-full">
          <p className="font-mono text-[10px] tracking-[0.25em] text-luxury-gray uppercase mb-3 text-center">
            Atelier Knowledge Base
          </p>
          <h1 className="font-serif text-3xl leading-tight text-luxury-charcoal uppercase tracking-[0.05em] md:text-5xl mb-6">
            Inquiries & Clarifications
          </h1>
          <p className="font-sans text-sm leading-relaxed text-luxury-gray md:text-base mb-10 max-w-2xl mx-auto">
            We believe in complete transparency regarding our curation process, shipping methods, and product lifecycle. Find detailed answers below.
          </p>

          {/* Search bar */}
          <div className="relative w-full max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-luxury-gray h-4 w-4" />
            <input
              type="text"
              className="w-full bg-white border border-[#eae7e7] rounded-full py-4 pl-12 pr-6 font-sans text-xs md:text-sm text-luxury-charcoal focus:outline-none focus:ring-1 focus:ring-luxury-charcoal transition-all shadow-sm"
              placeholder="Search topics (e.g., 'international shipping')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Directory Layout */}
        <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-10 items-start mt-6">
          {/* Sticky Sidebar Navigation */}
          <aside className="md:col-span-3 text-left">
            <p className="font-mono text-[10px] tracking-[0.25em] text-luxury-gray uppercase mb-4">
              Directory
            </p>
            <nav id="faq-categories-nav" className="flex flex-col space-y-3.5 border-l border-[#eae7e7] pl-4">
              {CATEGORIES.map((cat) => (
                <button
                  id={`faq-cat-btn-${cat.id}`}
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`text-left text-xs font-semibold uppercase tracking-wider transition-colors ${
                    selectedCategory === cat.id
                      ? 'text-luxury-charcoal font-bold font-serif border-l-2 border-luxury-charcoal -ml-[18px] pl-[16px]'
                      : 'text-luxury-gray hover:text-luxury-charcoal'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Accordion Questions List */}
          <div className="md:col-span-9 space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-[#eae7e7] p-8">
                <HelpCircle className="h-8 w-8 text-luxury-gray mx-auto mb-3" />
                <p className="font-serif text-base text-luxury-charcoal uppercase">No matching inquiries found</p>
                <p className="font-sans text-xs text-luxury-gray mt-1">Please try modifying your search, or email our concierge.</p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const isOpen = !!expandedItems[item.id];
                return (
                  <div
                    key={item.id}
                    className="bg-white border border-[#eae7e7] rounded-xl overflow-hidden transition-all duration-300"
                  >
                    <button
                      id={`faq-toggle-${item.id}`}
                      onClick={() => toggleExpand(item.id)}
                      className="w-full px-6 py-5 flex justify-between items-center text-left hover:bg-neutral-50/50 transition-colors cursor-pointer"
                    >
                      <h4 className="font-serif text-sm font-semibold tracking-wide text-luxury-charcoal uppercase">
                        {item.question}
                      </h4>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-luxury-gray flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-luxury-gray flex-shrink-0" />
                      )}
                    </button>
                    
                    {isOpen && (
                      <div className="px-6 pb-6 pt-1 border-t border-gray-50">
                        <p className="font-sans text-xs leading-relaxed text-luxury-gray md:text-sm">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* General CTA assistance block */}
            <div className="bg-[#FAF9F6] border border-[#eae7e7] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 mt-8">
              <div className="text-left space-y-1">
                <h3 className="font-serif text-base text-luxury-charcoal uppercase tracking-wider font-semibold">Still need assistance?</h3>
                <p className="font-sans text-xs text-luxury-gray leading-relaxed">
                  Our private client advisory and sustainable concierge team is standing by to resolve any highly specific inquiry.
                </p>
              </div>
              <button
                onClick={() => setView('contact')}
                className="bg-[#18231a] text-white font-semibold text-xs tracking-widest px-6 py-3 rounded-full hover:bg-neutral-800 uppercase transition-all whitespace-nowrap"
              >
                Connect with us
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
