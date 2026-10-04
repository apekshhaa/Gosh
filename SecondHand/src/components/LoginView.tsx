import React, { useState } from 'react';
import { ViewState } from '../types';
import { editorialImages } from '../images';

interface LoginViewProps {
  setView: (view: ViewState) => void;
  onLoginSuccess?: (userData: { name: string; email: string }) => void;
}

export default function LoginView({ setView, onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showForgotHint, setShowForgotHint] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // Use default mock credentials name if Eleanor is signing in, or auto-split from the email prefix
    const mockName = email.toLowerCase().includes('eleanor') ? 'Eleanor Vance' : email.split('@')[0].split('.').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    if (onLoginSuccess) {
      onLoginSuccess({
        name: mockName || 'Eleanor Vance',
        email: email
      });
    }

    setView('home');
  };

  const handleThirdPartySignIn = (provider: string) => {
    if (onLoginSuccess) {
      onLoginSuccess({
        name: 'Eleanor Vance',
        email: 'eleanor.v@example.com'
      });
    }
    setView('home');
  };

  return (
    <div className="bg-[#FAF9F6] text-[#1C1C1C] min-h-screen pt-16 flex">
      <div className="w-full flex">
        
        {/* Left Side: Form Container */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-24 bg-[#FAF9F6] text-left">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <h1 className="font-serif text-3xl md:text-4xl font-semibold tracking-tight text-[#1C1C1C] mb-2.5">
                Welcome Back
              </h1>
              <p className="text-sm text-luxury-gray font-light leading-relaxed">
                Sign in to access your curated collection and continue your GOSH journey.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block font-sans text-[10px] font-bold text-luxury-gray uppercase tracking-widest mb-2" htmlFor="email">
                  Email Address
                </label>
                <input 
                  className="w-full bg-white border border-luxury-border rounded-lg px-4 py-3 font-sans text-xs text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] transition-colors" 
                  id="email" 
                  name="email" 
                  placeholder="you@example.com" 
                  required 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-sans text-[10px] font-bold text-luxury-gray uppercase tracking-widest" htmlFor="password">
                    Password
                  </label>
                  <button 
                    type="button"
                    onClick={() => setShowForgotHint(!showForgotHint)}
                    className="font-sans text-[10px] text-luxury-gray hover:text-[#1C1C1C] uppercase font-bold tracking-wider hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                {showForgotHint && (
                  <div className="mb-2 p-3 bg-luxury-sand text-[11px] text-luxury-gray leading-relaxed rounded border border-luxury-border">
                    Please check your secure private ledger key file sent to your verified boutique registration email.
                  </div>
                )}
                <input 
                  className="w-full bg-white border border-luxury-border rounded-lg px-4 py-3 font-sans text-xs text-[#1C1C1C] focus:outline-none focus:border-[#1C1C1C] transition-colors" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button 
                id="login-submit-btn"
                className="w-full bg-[#1C1C1C] text-white font-sans text-xs font-bold py-4 rounded-lg hover:bg-[#333333] active:scale-[0.99] transition-all uppercase tracking-widest mt-6" 
                type="submit"
              >
                Sign In
              </button>
            </form>

            {/* Divider divider and third party login options matching mockups */}
            <div className="mt-8 flex items-center">
              <div className="flex-grow border-t border-luxury-border/60"></div>
              <span className="mx-4 font-mono text-[9px] text-[#1c1c1c]/50 uppercase tracking-widest font-bold">Or continue with</span>
              <div className="flex-grow border-t border-luxury-border/60"></div>
            </div>

            <div className="mt-8 space-y-3">
              <button 
                onClick={() => handleThirdPartySignIn('Google')}
                className="w-full flex items-center justify-center gap-3 border border-luxury-border bg-white text-[#1C1C1C] font-sans text-xs font-bold py-3.5 rounded-lg hover:bg-[#FAF9F6] active:scale-[0.99] transition-all shadow-xs"
                id="btn-google-signin"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                Google
              </button>

              <button 
                onClick={() => handleThirdPartySignIn('Apple')}
                className="w-full flex items-center justify-center gap-3 border border-luxury-border bg-white text-[#1C1C1C] font-sans text-xs font-bold py-3.5 rounded-lg hover:bg-[#FAF9F6] active:scale-[0.99] transition-all shadow-xs"
                id="btn-apple-signin"
              >
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.05 2.26.45 3.09.45.81 0 2.23-.58 3.81-.43 1.65.05 3.07.6 3.9 1.54-3.32 1.81-2.73 6.2.53 7.49-.69 1.57-1.53 2.89-3.33 3.92zM12.03 7.25c-.15-2.53 2.15-4.73 4.54-4.96.34 2.8-2.52 4.99-4.54 4.96z"></path>
                </svg>
                Apple
              </button>
            </div>

            <div className="mt-10 text-center">
              <p className="text-xs text-luxury-gray font-light">
                Don't have an account?{' '}
                <button 
                  id="login-to-register-btn"
                  type="button"
                  onClick={() => setView('register')}
                  className="text-[#1C1C1C] font-semibold hover:underline underline-offset-4 transition-colors"
                >
                  Create an account
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Editorial Image */}
        <div className="hidden md:block w-1/2 relative bg-[#ECE9E4] overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] hover:scale-105" 
            style={{ backgroundImage: `url('${editorialImages.login}')` }}
          />
          {/* Overlay matching the aesthetic of the luxury brand */}
          <div className="absolute inset-0 bg-[#18231a]/5 mix-blend-multiply pointer-events-none"></div>
        </div>

      </div>
    </div>
  );
}
