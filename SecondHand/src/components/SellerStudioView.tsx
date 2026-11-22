import React, { useCallback, useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../api/client';
import type { ViewState } from '../types';

type Account = { id: string; name: string; email: string; role: 'buyer' | 'seller' | 'admin' };
type SellerApplication = { status: 'pending' | 'approved' | 'rejected' | 'suspended'; rejectionReason?: string };
type Listing = { _id: string; title: string; description: string; category: string; subcategory: string; brand?: string; size: string; condition: string; pricePaise: number; inventory: number; imageUrls: string[]; status: string; rejectionReason?: string };
type SellerOrder = { _id: string; orderNumber: string; status: string; paymentStatus: string; itemSubtotalPaise: number; discountsPaise: number; totalPaise: number; commissionRateBps: number; commissionBasisPaise: number; sellerCommissionPaise?: number; platformCommissionPaise: number; buyerMarketplaceFeePaise?: number; sellerSharePaise: number; disputeStatus?: string; items: Array<{ title: string; quantity: number }> };
type SellerPayout = { _id: string; status: string; productSubtotalPaise: number; commissionRateBps: number; commissionAmountPaise: number; sellerNetPaise: number; providerName: string; providerReference?: string; failureReason?: string };

export default function SellerStudioView({ setView }: { setView: (view: ViewState) => void }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [application, setApplication] = useState<SellerApplication | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [payouts, setPayouts] = useState<SellerPayout[]>([]);
  const [shipmentForm, setShipmentForm] = useState({ orderId: '', courierName: '', trackingId: '', shippedAt: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [form, setForm] = useState({ title: '', description: '', category: 'womens', subcategory: 'tops', brand: '', size: 'M', condition: 'excellent', price: '', inventory: '1', image: null as File | null });
  const [editId, setEditId] = useState('');
  const [applicationForm, setApplicationForm] = useState({ displayName: '', legalName: '', line1: '', city: '', state: '', postalCode: '', country: 'IN', agreementAccepted: false });

  const loadAccount = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await apiRequest<{ user: Account }>('/auth/me');
      setAccount(result.user);
      try {
        const current = await apiRequest<{ application: SellerApplication }>('/seller/me');
        setApplication(current.application);
      } catch (cause) {
        if (!(cause instanceof ApiError && cause.status === 404)) throw cause;
        setApplication(null);
      }
      if (result.user.role === 'seller') {
        const [own, sellerOrders, payoutLedger] = await Promise.all([apiRequest<{ products: Listing[] }>('/seller/products?limit=100'), apiRequest<{ orders: SellerOrder[] }>('/orders/seller?limit=100'), apiRequest<{ payouts: SellerPayout[] }>('/orders/seller/payouts')]);
        setListings(own.products);
        setOrders(sellerOrders.orders);
        setPayouts(payoutLedger.payouts);
      } else { setListings([]); setOrders([]); setPayouts([]); }
      return true;
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) { setAccount(null); setApplication(null); setListings([]); setOrders([]); setPayouts([]); }
      else setError(cause instanceof Error ? cause.message : 'Seller information could not be loaded.');
      return false;
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadAccount(); }, [loadAccount]);

  const signInOrRegister = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login' ? { email, password } : { name, email, password };
      const result = await apiRequest<{ user: Account }>(path, { method: 'POST', body: JSON.stringify(body) });
      setAccount(result.user);
      const refreshed = await loadAccount();
      if (refreshed) setMessage('You are signed in.');
      else setMessage('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Sign in failed.'); }
    finally { setBusy(false); }
  };

  const signOut = async () => {
    setBusy(true);
    try { await apiRequest('/auth/logout', { method: 'POST', body: '{}' }); setAccount(null); setApplication(null); setListings([]); setOrders([]); setPayouts([]); setMessage('You are signed out.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Sign out failed.'); }
    finally { setBusy(false); }
  };

  const submitSellerApplication = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      await apiRequest('/seller/apply', {
        method: 'POST',
        body: JSON.stringify({
          displayName: applicationForm.displayName,
          legalName: applicationForm.legalName,
          address: { line1: applicationForm.line1, city: applicationForm.city, state: applicationForm.state, postalCode: applicationForm.postalCode, country: applicationForm.country },
          agreementAccepted: applicationForm.agreementAccepted,
        }),
      });
      setMessage('Seller application submitted for review.');
      await loadAccount();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Seller application could not be submitted.'); }
    finally { setBusy(false); }
  };

  const createListing = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      let imageUrls: string[] = [];
      if (form.image) {
        const image = await fileAsDataUrl(form.image);
        const uploaded = await apiRequest<{ imageUrl: string }>('/seller/products/images', { method: 'POST', body: JSON.stringify({ image }) });
        imageUrls = [uploaded.imageUrl];
      }
      const body = { title: form.title, description: form.description, category: form.category, subcategory: form.subcategory, brand: form.brand || undefined, size: form.size, condition: form.condition, pricePaise: Math.round(Number(form.price) * 100), inventory: Math.max(1, Math.trunc(Number(form.inventory))), imageUrls };
      if (editId) {
        await apiRequest(`/seller/products/${editId}`, { method: 'PATCH', body: JSON.stringify(body) });
        setMessage('Listing updated and submitted for review.');
      } else {
        await apiRequest('/seller/products', { method: 'POST', body: JSON.stringify(body) });
        setMessage('Listing submitted for review. It will appear in the collection after approval.');
      }
      setEditId('');
      setForm({ title: '', description: '', category: 'womens', subcategory: 'tops', brand: '', size: 'M', condition: 'excellent', price: '', inventory: '1', image: null });
      await loadAccount();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Listing could not be submitted.'); }
    finally { setBusy(false); }
  };

  const archiveListing = async (id: string) => {
    setBusy(true); setError('');
    try { await apiRequest(`/seller/products/${id}`, { method: 'DELETE' }); setListings((items) => items.map((item) => item._id === id ? { ...item, status: 'removed' } : item)); setMessage('Listing archived.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Listing could not be archived.'); }
    finally { setBusy(false); }
  };

  const editListing = (listing: Listing) => {
    setEditId(listing._id);
    setForm({
      title: listing.title,
      description: listing.description,
      category: listing.category,
      subcategory: listing.subcategory,
      brand: listing.brand || '',
      size: listing.size,
      condition: listing.condition,
      price: (listing.pricePaise / 100).toFixed(2),
      inventory: String(listing.inventory ?? 1),
      image: null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateOrderStatus = async (id: string, status: 'processing') => {
    setBusy(true); setError('');
    try { const result = await apiRequest<{ order: SellerOrder }>(`/orders/seller/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); setOrders((items) => items.map((item) => item._id === id ? result.order : item)); setMessage(`Order status updated to ${status}.`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Order status could not be updated.'); }
    finally { setBusy(false); }
  };

  const submitShipment = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await apiRequest(`/orders/seller/${shipmentForm.orderId}/shipment`, { method: 'POST', body: JSON.stringify({ courierName: shipmentForm.courierName, trackingId: shipmentForm.trackingId, shippedAt: shipmentForm.shippedAt }) });
      setShipmentForm({ orderId: '', courierName: '', trackingId: '', shippedAt: '' });
      setMessage('Shipment submitted. Delivery still requires independent verification; no payout was initiated.');
      await loadAccount();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Shipment could not be submitted.'); }
    finally { setBusy(false); }
  };

  return <section className="mx-auto min-h-[60vh] max-w-4xl px-6 py-12 md:py-20" aria-labelledby="seller-studio-title">
    <button onClick={() => setView('about')} className="mb-6 text-xs uppercase tracking-wider text-luxury-gray underline underline-offset-4">Back to GOSH</button>
    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-luxury-gray">Seller workspace</p>
    <h1 id="seller-studio-title" className="mt-2 font-serif text-3xl text-luxury-charcoal">Your GOSH listings</h1>
    <p className="mt-3 max-w-2xl text-sm leading-6 text-luxury-gray">Manage your listings and fulfillment updates here. Orders remain unpaid; this workspace does not process payments.</p>
    {error && <p role="alert" className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    {message && <p role="status" className="mt-6 border border-luxury-border px-4 py-3 text-sm">{message}</p>}
    {loading ? <p className="py-12 text-sm text-luxury-gray" role="status">Loading your seller account…</p> : !account ? <form onSubmit={signInOrRegister} className="mt-8 grid max-w-xl gap-4 border border-luxury-border p-5 sm:p-7">
      <h2 className="font-serif text-xl">{mode === 'login' ? 'Sign in to continue' : 'Create a buyer account'}</h2>
      {mode === 'register' && <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Name<input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label>}
      <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label>
      <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Password<input required minLength={10} maxLength={128} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label>
      <button disabled={busy} className="min-h-12 bg-luxury-charcoal px-5 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50">{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
      <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="min-h-10 text-left text-xs underline underline-offset-4">{mode === 'login' ? 'New to GOSH? Create a buyer account' : 'Already have an account? Sign in'}</button>
    </form> : <>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-y border-luxury-border py-4 text-sm"><span>{account.name} · {account.email} · {account.role}</span><button onClick={() => void signOut()} disabled={busy} className="min-h-10 underline underline-offset-4">Sign out</button></div>
      {account.role !== 'seller' ? <div className="mt-8 border border-luxury-border p-5 sm:p-7">
        <h2 className="font-serif text-xl">Seller application</h2>
        <p className="mt-3 text-sm text-luxury-gray">{application ? <>Application status: <strong className="capitalize text-luxury-charcoal">{application.status}</strong>{application.rejectionReason && <span className="mt-2 block">Review note: {application.rejectionReason}</span>}</> : 'No seller application is linked to this account yet.'}</p>
        {(!application || application.status === 'rejected') ? <form onSubmit={submitSellerApplication} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Store name<input required minLength={2} maxLength={80} value={applicationForm.displayName} onChange={(event) => setApplicationForm({ ...applicationForm, displayName: event.target.value })} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label>
          <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Legal name<input required minLength={2} maxLength={120} value={applicationForm.legalName} onChange={(event) => setApplicationForm({ ...applicationForm, legalName: event.target.value })} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label>
          <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Address line 1<input required minLength={3} maxLength={200} value={applicationForm.line1} onChange={(event) => setApplicationForm({ ...applicationForm, line1: event.target.value })} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">City<input required minLength={2} maxLength={100} value={applicationForm.city} onChange={(event) => setApplicationForm({ ...applicationForm, city: event.target.value })} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label>
            <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">State<input required minLength={2} maxLength={100} value={applicationForm.state} onChange={(event) => setApplicationForm({ ...applicationForm, state: event.target.value })} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label>
            <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Postal code<input required minLength={3} maxLength={20} value={applicationForm.postalCode} onChange={(event) => setApplicationForm({ ...applicationForm, postalCode: event.target.value })} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label>
            <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Country code<input required maxLength={2} value={applicationForm.country} onChange={(event) => setApplicationForm({ ...applicationForm, country: event.target.value.toUpperCase() })} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label>
          </div>
          <label className="flex items-start gap-3 text-sm"><input required type="checkbox" checked={applicationForm.agreementAccepted} onChange={(event) => setApplicationForm({ ...applicationForm, agreementAccepted: event.target.checked })} className="mt-1" /><span>I confirm the seller agreement and application details.</span></label>
          <button disabled={busy} className="min-h-12 bg-luxury-charcoal px-5 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50">{busy ? 'Submitting…' : application?.status === 'rejected' ? 'Resubmit application' : 'Submit seller application'}</button>
        </form> : application.status === 'pending' ? <p className="mt-5 text-sm text-luxury-gray">Your application is awaiting manual review.</p> : null}
      </div> : application?.status !== 'approved' ? <p className="mt-8 border border-luxury-border p-5 text-sm">Seller access is unavailable until your application is approved.</p> : <>
        <form onSubmit={createListing} className="mt-8 grid gap-4 border border-luxury-border p-5 sm:p-7">
          <h2 className="font-serif text-xl">{editId ? 'Edit listing and resubmit for review' : 'Submit a listing for review'}</h2>
          <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Title<input required minLength={2} maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label>
          <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Description<textarea required minLength={10} maxLength={5000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="min-h-24 border border-luxury-border bg-transparent p-3 text-sm normal-case text-luxury-charcoal" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Department<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="min-h-11 border border-luxury-border bg-luxury-sand px-3 text-sm normal-case text-luxury-charcoal"><option value="womens">Women</option><option value="mens">Men</option><option value="children">Children</option><option value="accessories">Accessories</option></select></label>
            <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Category<input required maxLength={80} value={form.subcategory} onChange={(event) => setForm({ ...form, subcategory: event.target.value })} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label>
            <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Brand<input maxLength={100} value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label>
            <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Size<input required maxLength={30} value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label>
            <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Condition<select value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value })} className="min-h-11 border border-luxury-border bg-luxury-sand px-3 text-sm normal-case text-luxury-charcoal"><option value="pristine">Pristine</option><option value="excellent">Excellent</option><option value="very_good">Very good</option><option value="good">Good</option></select></label>
            <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Price (₹)<input required type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label>
            <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Inventory<input required type="number" min="1" step="1" value={form.inventory} onChange={(event) => setForm({ ...form, inventory: event.target.value })} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label>
            <label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Photo (JPEG, PNG, WebP; max 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setForm({ ...form, image: event.target.files?.[0] || null })} className="min-h-11 py-2 text-xs normal-case text-luxury-charcoal" /></label>
          </div>
          <button disabled={busy} className="min-h-12 bg-luxury-charcoal px-5 text-xs font-semibold uppercase tracking-widest text-white disabled:opacity-50">{busy ? 'Submitting…' : editId ? 'Update listing' : 'Submit for review'}</button>
        </form>
        <div className="mt-10"><h2 className="font-serif text-2xl">Your listings</h2>{listings.length ? <ul className="mt-4 divide-y divide-luxury-border border-y border-luxury-border">{listings.map((listing) => <li key={listing._id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><h3 className="font-medium">{listing.title}</h3><p className="mt-1 text-xs capitalize text-luxury-gray">{listing.status.replace('_', ' ')} · ₹{(listing.pricePaise / 100).toFixed(2)} · {listing.inventory ?? 1} in stock</p>{listing.rejectionReason && <p className="mt-1 text-xs text-luxury-gray">Review note: {listing.rejectionReason}</p>}</div>{!['removed', 'sold'].includes(listing.status) && <div className="flex gap-2"><button disabled={busy} onClick={() => editListing(listing)} className="min-h-10 border border-luxury-border px-4 text-xs uppercase tracking-wider disabled:opacity-50">Edit</button><button disabled={busy} onClick={() => void archiveListing(listing._id)} className="min-h-10 border border-luxury-border px-4 text-xs uppercase tracking-wider disabled:opacity-50">Archive</button></div>}</li>)}</ul> : <p className="mt-4 text-sm text-luxury-gray">You have not submitted any listings yet.</p>}</div>
        <div className="mt-12"><h2 className="font-serif text-2xl">Shipment confirmation</h2><p className="mt-2 text-xs text-luxury-gray">Submitting shipment does not verify delivery or initiate a payout.</p><form onSubmit={submitShipment} className="mt-4 grid gap-3 border border-luxury-border p-5 sm:grid-cols-2"><label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Paid order<select required value={shipmentForm.orderId} onChange={(event) => setShipmentForm({ ...shipmentForm, orderId: event.target.value })} className="min-h-11 border border-luxury-border bg-luxury-sand px-3 text-sm normal-case text-luxury-charcoal"><option value="">Select order</option>{orders.filter((order) => order.paymentStatus === 'paid' && order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'cancelled').map((order) => <option key={order._id} value={order._id}>{order.orderNumber}</option>)}</select></label><label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Courier name<input required minLength={2} maxLength={100} value={shipmentForm.courierName} onChange={(event) => setShipmentForm({ ...shipmentForm, courierName: event.target.value })} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label><label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Tracking ID<input required minLength={3} maxLength={200} value={shipmentForm.trackingId} onChange={(event) => setShipmentForm({ ...shipmentForm, trackingId: event.target.value })} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label><label className="grid gap-2 text-xs uppercase tracking-wider text-luxury-gray">Shipment date<input required type="datetime-local" value={shipmentForm.shippedAt} onChange={(event) => setShipmentForm({ ...shipmentForm, shippedAt: event.target.value ? new Date(event.target.value).toISOString() : '' })} className="min-h-11 border border-luxury-border bg-transparent px-3 text-sm normal-case text-luxury-charcoal" /></label><button disabled={busy} className="min-h-11 bg-luxury-charcoal px-5 text-xs uppercase tracking-widest text-white disabled:opacity-50 sm:col-span-2">Submit shipment</button></form></div>
        <div className="mt-12"><h2 className="font-serif text-2xl">Orders for your listings</h2><p className="mt-2 text-xs text-luxury-gray">New orders use the 5% seller commission. Historical orders show their original snapshot rate.</p>{orders.length ? <ul className="mt-4 divide-y divide-luxury-border border-y border-luxury-border">{orders.map((order) => { const next = order.status === 'pending_fulfillment' ? 'processing' as const : null; const commission = order.sellerCommissionPaise ?? order.platformCommissionPaise; return <li key={order._id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-mono text-xs">{order.orderNumber}</p><p className="mt-1 text-xs capitalize text-luxury-gray">{order.status.replaceAll('_', ' ')} · Payment {order.paymentStatus}</p><p className="mt-2 text-sm">{order.items.map((item) => `${item.title} × ${item.quantity}`).join(', ')} · Total ₹{(order.totalPaise / 100).toFixed(2)}</p><p className="mt-1 text-xs text-luxury-gray">Snapshot: {order.commissionRateBps / 100}% commission (−₹{(commission / 100).toFixed(2)}); estimated seller earnings ₹{(order.sellerSharePaise / 100).toFixed(2)}. Shipping and tax excluded.</p></div>{next && order.paymentStatus === 'paid' && <button disabled={busy} onClick={() => void updateOrderStatus(order._id, next)} className="min-h-10 border border-luxury-border px-4 text-xs uppercase tracking-wider disabled:opacity-50">Mark {next}</button>}</li>; })}</ul> : <p className="mt-4 text-sm text-luxury-gray">No orders for your listings.</p>}</div>
        <div className="mt-12"><h2 className="font-serif text-2xl">Payout ledger</h2><p className="mt-2 text-xs text-luxury-gray">Pending or blocked records are not money already transferred. Buyer acknowledgement does not make payout eligible; courier or admin trusted delivery verification is required.</p>{payouts.length ? <ul className="mt-4 divide-y divide-luxury-border border-y border-luxury-border">{payouts.map((payout) => <li key={payout._id} className="py-4"><p className="font-mono text-xs">{payout.status}</p><p className="mt-1 text-sm">Product ₹{(payout.productSubtotalPaise / 100).toFixed(2)} − 5% commission ₹{(payout.commissionAmountPaise / 100).toFixed(2)} = seller earnings ₹{(payout.sellerNetPaise / 100).toFixed(2)}</p>{payout.failureReason && <p className="mt-1 text-xs text-luxury-gray">{payout.failureReason === 'delivery_not_verified' ? 'Blocked: awaiting authenticated courier or authorized admin delivery verification.' : payout.failureReason}</p>}</li>)}</ul> : <p className="mt-4 text-sm text-luxury-gray">No payout records yet.</p>}</div>
      </>}
    </>}
  </section>;
}

function fileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The selected image could not be read.'));
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('The selected image is invalid.'));
    reader.readAsDataURL(file);
  });
}
