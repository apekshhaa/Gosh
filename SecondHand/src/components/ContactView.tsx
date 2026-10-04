import React, { useState } from 'react';
import { ViewState } from '../types';
import { Mail, ArrowRight, CheckCircle2, Instagram, MessageSquare } from 'lucide-react';
import { editorialImages } from '../images';

interface ContactViewProps {
  setView: (view: ViewState) => void;
}

export default function ContactView({ setView }: ContactViewProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email && message) {
      // Show elegant submit transition
      setIsSubmitted(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b] min-h-screen font-sans">
      <main className="max-w-7xl mx-auto px-6 py-12 md:px-12 md:py-20">
        {/* Header Hero Title */}
        <header className="max-w-3xl mx-auto text-center mb-16">
          <p className="font-mono text-[10px] tracking-[0.25em] text-luxury-gray uppercase mb-3">
            Atelier Correspondence
          </p>
          <h1 className="font-serif text-3xl leading-tight text-luxury-charcoal uppercase tracking-[0.05em] md:text-5xl mb-6">
            Connect with Us
          </h1>
          <p className="font-sans text-sm leading-relaxed text-luxury-gray md:text-base max-w-2xl mx-auto">
            Whether you're seeking styling advice, have questions about our curation process, or need assistance with an archive order, our dedicated concierge team is here to assist you.
          </p>
        </header>

        {/* Binary Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Image & Direct info cards */}
          <div className="lg:col-span-5 flex flex-col space-y-10 text-left">
            {/* Elegant luxury style photo */}
            <div className="w-full aspect-[4/5] bg-luxury-sand/50 rounded-2xl overflow-hidden relative shadow-lg">
              <img
                alt="Minimalist Atelier Vase and Shadows"
                className="w-full h-full object-cover hover:scale-[102%] transition-transform duration-700 ease-out"
                referrerPolicy="no-referrer"
                src={editorialImages.contact}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
            </div>

            {/* Direct Information card list */}
            <div className="space-y-6 pl-6 border-l border-[#eae7e7]">
              <div>
                <h3 className="font-mono text-[10px] tracking-[0.22em] text-luxury-gray uppercase mb-1.5">
                  Client Services
                </h3>
                <a
                  href="mailto:support@consciousluxury.com"
                  className="font-serif text-lg font-medium text-luxury-charcoal hover:text-neutral-600 transition-colors"
                >
                  support@consciousluxury.com
                </a>
                <p className="font-sans text-[11px] text-luxury-gray mt-1">
                  Available Mon–Fri, 9am–5pm EST
                </p>
              </div>

              <div>
                <h3 className="font-mono text-[10px] tracking-[0.22em] text-luxury-gray uppercase mb-1.5">
                  Social Echoes
                </h3>
                <div className="flex gap-4 font-sans text-xs">
                  <a href="#instagram" className="text-luxury-charcoal hover:text-luxury-gray underline underline-offset-4 transition-colors">
                    Instagram
                  </a>
                  <span className="text-gray-300">•</span>
                  <a href="#pinterest" className="text-luxury-charcoal hover:text-luxury-gray underline underline-offset-4 transition-colors">
                    Pinterest
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form interactive panel */}
          <div className="lg:col-span-7 bg-white border border-[#eae7e7] rounded-3xl p-8 md:p-12 shadow-sm text-left">
            {isSubmitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-800">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="font-serif text-2xl text-luxury-charcoal uppercase tracking-wider">
                  Inquiry Dispatched
                </h2>
                <p className="font-sans text-sm text-luxury-gray max-w-md mx-auto leading-relaxed">
                  Thank you for placing your request. A member of our private client archive or customer concierge team is reviewing your message. We respond within two hours.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="bg-luxury-charcoal text-white font-semibold text-xs tracking-widest px-6 py-3 rounded-full hover:bg-neutral-800 uppercase transition-all"
                  >
                    Send another message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="font-serif text-2xl text-luxury-charcoal uppercase tracking-wider mb-8">
                  Send a Message
                </h2>

                <div>
                  <label htmlFor="contact-name" className="block text-[11px] font-mono tracking-wider text-luxury-gray uppercase mb-2">
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#fcf9f8] border border-gray-200 rounded-xl px-4 py-3.5 text-xs md:text-sm focus:outline-none focus:border-luxury-charcoal focus:ring-1 focus:ring-luxury-charcoal transition-all font-sans text-luxury-charcoal"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-[11px] font-mono tracking-wider text-luxury-gray uppercase mb-2">
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#fcf9f8] border border-gray-200 rounded-xl px-4 py-3.5 text-xs md:text-sm focus:outline-none focus:border-luxury-charcoal focus:ring-1 focus:ring-luxury-charcoal transition-all font-sans text-luxury-charcoal"
                  />
                </div>

                <div>
                  <label htmlFor="contact-subject" className="block text-[11px] font-mono tracking-wider text-luxury-gray uppercase mb-2">
                    Subject
                  </label>
                  <select
                    id="contact-subject"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-[#fcf9f8] border border-gray-200 rounded-xl px-4 py-3.5 text-xs md:text-sm focus:outline-none focus:border-luxury-charcoal focus:ring-1 focus:ring-luxury-charcoal transition-all font-sans text-luxury-charcoal appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select a topic...</option>
                    <option value="styling">Styling Advice / Curation</option>
                    <option value="order">Order Check-in & Inquiries</option>
                    <option value="returns">Returns & Exchanges</option>
                    <option value="collaborations">Partnerships / Conscious Consignments</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-[11px] font-mono tracking-wider text-luxury-gray uppercase mb-2">
                    Your Message
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    placeholder="Describe how we can support your archive collection selections..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-[#fcf9f8] border border-gray-200 rounded-xl px-4 py-3.5 text-xs md:text-sm focus:outline-none focus:border-luxury-charcoal focus:ring-1 focus:ring-luxury-charcoal transition-all font-sans text-luxury-charcoal resize-none"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 bg-[#18231a] hover:bg-[#2d392f] text-[#FAF9F6] px-8 py-4 text-xs font-semibold tracking-widest uppercase transition-all rounded-full cursor-pointer shadow-md"
                  >
                    Send Message
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
