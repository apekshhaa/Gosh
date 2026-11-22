import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, LoaderCircle, Trash2 } from 'lucide-react';
import type { CartItem, Product, ViewState } from '../types';
import { ApiError, apiRequest } from '../api/client';
import { getPublicProduct } from '../api/products';
import { formatINR } from '../utils/currency';

type Account = { id: string; name: string; email: string };
type Address = { fullName: string; phone: string; line1: string; line2: string; city: string; state: string; postalCode: string; country: string };
const emptyAddress: Address = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'IN' };

export default function CheckoutView({ cart, setView, setSelectedProduct, onRemoveItem, onOrderCreated }: {
  cart: CartItem[]; setView: (view: ViewState) => void; setSelectedProduct: (product: Product) => void;
  onRemoveItem: (productId: string) => void; onOrderCreated: (orderId: string) => void;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [address, setAddress] = useState(emptyAddress);
  const [auth, setAuth] = useState({ mode: 'login' as 'login' | 'register', name: '', email: '', password: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const idempotencyKey = useRef(`checkout-${crypto.randomUUID()}`);

  const refreshItems = useCallback(async () => {
    setLoading(true); setError('');
    const available: CartItem[] = [];
    for (const item of cart) {
      try {
        const product = await getPublicProduct(item.product.id);
        available.push({ ...item, product, selectedSize: product.size });
      } catch {
        onRemoveItem(item.product.id);
      }
    }
    setItems(available);
    setLoading(false);
  }, [cart, onRemoveItem]);

  useEffect(() => { void refreshItems(); }, [refreshItems]);
  useEffect(() => {
    apiRequest<{ user: Account }>('/auth/me').then((result) => setAccount(result.user)).catch((cause) => {
      if (!(cause instanceof ApiError && cause.status === 401)) setError('Your account could not be loaded.');
    });
  }, []);

  const updateAddress = (field: keyof Address, value: string) => setAddress((current) => ({ ...current, [field]: value }));
  const signIn = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const path = auth.mode === 'login' ? '/auth/login' : '/auth/register';
      const body = auth.mode === 'login' ? { email: auth.email, password: auth.password } : { name: auth.name, email: auth.email, password: auth.password };
      const result = await apiRequest<{ user: Account }>(path, { method: 'POST', body: JSON.stringify(body) });
      setAccount(result.user);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Sign in failed.'); }
    finally { setBusy(false); }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !account || !items.length) return;
    setBusy(true); setError('');
    try {
      const result = await apiRequest<{ order: { _id: string } }>('/orders', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey.current },
        body: JSON.stringify({ items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity, selectedSize: item.selectedSize })), deliveryAddress: { ...address, line2: address.line2 || undefined } }),
      });
      onOrderCreated(result.order._id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your order could not be created.');
      if (cause instanceof ApiError && cause.status === 409) await refreshItems();
    } finally { setBusy(false); }
  };

  if (!cart.length || (!loading && !items.length)) return <EmptyCheckout setView={setView} />;
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  return <section className="mx-auto min-h-[60vh] max-w-6xl px-5 py-10 md:px-12 md:py-16">
    <button onClick={() => setView('cart')} className="mb-6 inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-wider text-luxury-gray underline"><ArrowLeft className="h-4 w-4" /> Back to bag</button>
    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-luxury-gray">Order reservation</p><h1 className="mt-2 font-serif text-3xl">Checkout</h1>
    {error && <p role="alert" className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    {loading ? <p role="status" className="py-16 text-sm text-luxury-gray">Checking availability…</p> : !account ? <AuthForm auth={auth} setAuth={setAuth} busy={busy} onSubmit={signIn} /> : <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-8">
        <fieldset className="border border-luxury-border p-5 sm:p-7"><legend className="px-2 font-serif text-xl">Delivery details</legend><div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Field label="Full name" value={address.fullName} onChange={(v) => updateAddress('fullName', v)} required /><Field label="Phone" type="tel" value={address.phone} onChange={(v) => updateAddress('phone', v)} required />
          <Field label="Address line 1" value={address.line1} onChange={(v) => updateAddress('line1', v)} required className="sm:col-span-2" /><Field label="Address line 2 (optional)" value={address.line2} onChange={(v) => updateAddress('line2', v)} className="sm:col-span-2" />
          <Field label="City" value={address.city} onChange={(v) => updateAddress('city', v)} required /><Field label="State" value={address.state} onChange={(v) => updateAddress('state', v)} required /><Field label="Postal code" value={address.postalCode} onChange={(v) => updateAddress('postalCode', v)} required /><Field label="Country code" value={address.country} onChange={(v) => updateAddress('country', v.toUpperCase())} required maxLength={2} />
        </div></fieldset>
        <fieldset className="border border-luxury-border p-5 sm:p-7"><legend className="px-2 font-serif text-xl">Items</legend><ul className="mt-3 divide-y divide-luxury-border">{items.map((item) => <li key={item.product.id} className="flex gap-4 py-4">
          <button type="button" onClick={() => { setSelectedProduct(item.product); setView('detail'); }} className="h-24 w-20 shrink-0 overflow-hidden bg-luxury-sand">{item.product.image ? <img src={item.product.image} alt={item.product.title} className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center text-[10px] text-luxury-gray">GOSH</span>}</button>
          <div className="min-w-0 flex-1"><p className="font-serif text-lg">{item.product.title}</p><p className="text-xs text-luxury-gray">Size {item.selectedSize} · Qty {item.quantity}</p><p className="mt-2 font-mono text-sm">{formatINR(item.product.price, true)}</p></div>
          <button type="button" onClick={() => onRemoveItem(item.product.id)} className="self-start p-2 text-luxury-gray" aria-label={`Remove ${item.product.title}`}><Trash2 className="h-4 w-4" /></button>
        </li>)}</ul></fieldset>
      </div>
      <aside className="h-fit border border-luxury-border bg-[#FBFBFA] p-5"><h2 className="font-serif text-xl">Review order</h2><div className="mt-5 flex justify-between border-b border-luxury-border pb-4 text-sm"><span>Items subtotal</span><span className="font-mono">{formatINR(subtotal, true)}</span></div><div className="mt-4 flex justify-between text-sm"><span>Buyer marketplace fee</span><span className="font-mono">{formatINR(0, true)}</span></div><p className="mt-4 text-xs leading-5 text-luxury-gray">The backend calculates the final total from current listing prices. GOSH charges the seller 5% of the discounted product subtotal, not you. Items are reserved for 20 minutes. Payment collection is not available yet.</p><button disabled={busy} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 bg-luxury-charcoal px-4 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <>Place unpaid order <ArrowRight className="h-4 w-4" /></>}</button></aside>
    </form>}
  </section>;
}

function Field({ label, value, onChange, required, type = 'text', className = '', maxLength }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; type?: string; className?: string; maxLength?: number }) {
  return <label className={`grid gap-2 text-xs uppercase tracking-wider text-luxury-gray ${className}`}>{label}<input required={required} type={type} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label>;
}

function AuthForm({ auth, setAuth, busy, onSubmit }: { auth: { mode: 'login' | 'register'; name: string; email: string; password: string }; setAuth: React.Dispatch<React.SetStateAction<typeof auth>>; busy: boolean; onSubmit: (event: React.FormEvent) => void }) {
  return <form onSubmit={onSubmit} className="mt-8 max-w-xl border border-luxury-border p-5 sm:p-7"><h2 className="font-serif text-xl">{auth.mode === 'login' ? 'Sign in to checkout' : 'Create an account to checkout'}</h2><div className="mt-6 grid gap-4">{auth.mode === 'register' && <Field label="Name" value={auth.name} onChange={(name) => setAuth((current) => ({ ...current, name }))} required />}<Field label="Email" type="email" value={auth.email} onChange={(email) => setAuth((current) => ({ ...current, email }))} required /><Field label="Password" type="password" value={auth.password} onChange={(password) => setAuth((current) => ({ ...current, password }))} required /></div><button disabled={busy} className="mt-6 min-h-11 bg-luxury-charcoal px-5 text-xs font-semibold uppercase tracking-wider text-white disabled:opacity-50">{busy ? 'Please wait…' : auth.mode === 'login' ? 'Sign in' : 'Create account'}</button><button type="button" onClick={() => setAuth((current) => ({ ...current, mode: current.mode === 'login' ? 'register' : 'login' }))} className="ml-4 text-xs underline">{auth.mode === 'login' ? 'Create an account' : 'I already have an account'}</button></form>;
}

function EmptyCheckout({ setView }: { setView: (view: ViewState) => void }) {
  return <div className="mx-auto min-h-[50vh] max-w-2xl px-6 py-24 text-center"><p className="font-serif text-xl">Your bag is empty or no longer available.</p><button onClick={() => setView('shop')} className="mt-4 text-sm underline">Continue shopping</button></div>;
}
