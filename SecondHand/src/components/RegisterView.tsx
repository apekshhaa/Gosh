import React, { useState } from 'react';
import { ViewState } from '../types';
import { editorialImages } from '../images';

interface RegisterViewProps {
  setView: (view: ViewState) => void;
  onRegisterSuccess?: (userData: { name: string; email: string }) => void;
}

export default function RegisterView({ setView, onRegisterSuccess }: RegisterViewProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUpNewsletter, setSignUpNewsletter] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) return;
    
    // Trigger callback if defined
    if (onRegisterSuccess) {
      onRegisterSuccess({
        name: `${firstName} ${lastName}`,
        email: email
      });
    }
    
    // Redirect to home (landing page) view
    setView('home');
  };

  return (
    <div className="bg-[#FAF9F6] text-[#1C1C1C] min-h-screen pt-16 flex items-center justify-center">
      <div className="w-full max-w-7xl mx-auto px-6 md:px-12 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Editorial Image (Left Column Desktop Only) */}
        <div className="hidden lg:block lg:col-span-6 h-[720px] relative rounded-xl overflow-hidden bg-[#ECE9E4] shadow-sm">
          <img 
            alt="Editorial fashion photography" 
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-[10000ms] hover:scale-105" 
            referrerPolicy="no-referrer"
            src={editorialImages.register} 
          />
          <div className="absolute inset-0 bg-[#18231a]/5 mix-blend-multiply pointer-events-none"></div>
        </div>

        {/* Registration Form (Right Column) */}
        <div className="col-span-1 lg:col-span-5 lg:col-start-8 flex flex-col justify-center text-left">
          <div className="mb-10">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-[#1C1C1C] mb-3">
              Join the Collective
            </h1>
            <p className="text-sm md:text-[15px] leading-relaxed text-luxury-gray font-light">
              Create an account to curate your ethical wardrobe and access exclusive editorial edits.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-sans text-[10px] font-bold text-luxury-gray uppercase tracking-widest" htmlFor="firstName">
                  First Name
                </label>
                <input 
                  className="bg-white border border-luxury-border rounded-lg px-4 py-3 font-sans text-xs text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] transition-colors" 
                  id="firstName" 
                  name="firstName" 
                  required 
                  type="text" 
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Eleanor"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-sans text-[10px] font-bold text-luxury-gray uppercase tracking-widest" htmlFor="lastName">
                  Last Name
                </label>
                <input 
                  className="bg-white border border-luxury-border rounded-lg px-4 py-3 font-sans text-xs text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] transition-colors" 
                  id="lastName" 
                  name="lastName" 
                  required 
                  type="text" 
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Vance"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-sans text-[10px] font-bold text-luxury-gray uppercase tracking-widest" htmlFor="email">
                Email Address
              </label>
              <input 
                className="bg-white border border-luxury-border rounded-lg px-4 py-3 font-sans text-xs text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] transition-colors" 
                id="email" 
                name="email" 
                required 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="eleanor.v@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-sans text-[10px] font-bold text-luxury-gray uppercase tracking-widest" htmlFor="password">
                Password
              </label>
              <input 
                className="bg-white border border-luxury-border rounded-lg px-4 py-3 font-sans text-xs text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] transition-colors" 
                id="password" 
                name="password" 
                required 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-start gap-3 mt-2">
              <div className="flex items-center h-5">
                <input 
                  className="w-4 h-4 rounded border-luxury-border text-[#1C1C1C] focus:ring-[#1C1C1C] bg-white cursor-pointer transition-colors" 
                  id="newsletter" 
                  name="newsletter" 
                  type="checkbox"
                  checked={signUpNewsletter}
                  onChange={(e) => setSignUpNewsletter(e.target.checked)}
                />
              </div>
              <div className="text-xs leading-relaxed text-luxury-gray">
                <label className="cursor-pointer font-light" htmlFor="newsletter">
                  Sign up for the GOSH newsletter. Receive curated drops, editorial insights, and early access to sustainable collections.
                </label>
              </div>
            </div>

            <div className="mt-6">
              <button 
                id="register-submit-btn"
                className="w-full bg-[#1C1C1C] text-white font-sans text-xs font-bold px-8 py-4 rounded-lg hover:bg-[#333333] active:scale-[0.99] transition-all text-center uppercase tracking-widest" 
                type="submit"
              >
                Create Account
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-luxury-gray font-light">
                Already have an account?{' '}
                <button 
                  id="register-to-login-btn"
                  type="button"
                  onClick={() => setView('login')}
                  className="text-[#1C1C1C] font-semibold hover:underline underline-offset-4 transition-colors"
                >
                  Log In
                </button>
              </p>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
