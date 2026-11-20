import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, LoaderCircle, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { ApiError, apiRequest } from '../api/client';
import type { ViewState } from '../types';
import { formatINR } from '../utils/currency';

type Tab = 'overview' | 'sellers' | 'products' | 'orders' | 'payments';
type AdminUser = { _id: string; name: string; email: string; role: string; status: string };
type SellerApplication = { _id: string; displayName: string; legalName: string; status: string; rejectionReason?: string; user?: { name: string; email: string } };
type Product = { _id: string; title: string; pricePaise: number; status: string; seller?: { name: string; email: string }; rejectionReason?: string };
type Order = { _id: string; orderNumber: string; status: string; paymentStatus: string; totalPaise: number; createdAt: string; buyer?: { name: string; email: string }; seller?: { name: string; email: string }; statusHistory?: Array<{ action: string; fromStatus: string; toStatus: string; reason?: string; at: string }> };
type Overview = { counts: Record<string, number>; finance: { capturedPaise: number; platformCommissionPaise: number; sellerSharePaise: number }; paymentProvider: string };

export default function AdminDashboard({ setView }: { setView: (view: ViewState) => void }) {
  const [account, setAccount] = useState<AdminUser | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [sellers, setSellers] = useState<SellerApplication[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Array<{ _id: string; amountPaise: number; status: string; provider: string; createdAt: string }>>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState('');
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setBusy(true); setError('');
    try {
      const me = await apiRequest<{ user: AdminUser }>('/users/me');
      if (me.user.role !== 'admin') throw new ApiError('Admin access is required.', 403);
      setAccount(me.user);
      const [summary, sellerList, productList, orderList, paymentList] = await Promise.all([
        apiRequest<Overview>('/admin/overview'),
        apiRequest<{ applications: SellerApplication[] }>('/admin/sellers?limit=100'),
        apiRequest<{ products: Product[] }>('/admin/products?status=pending_review&limit=100'),
        apiRequest<{ orders: Order[] }>('/orders/admin?limit=100'),
        apiRequest<{ attempts: typeof payments }>('/admin/payments?limit=100'),
      ]);
      setOverview(summary); setSellers(sellerList.applications); setProducts(productList.products); setOrders(orderList.orders); setPayments(paymentList.attempts);
    } catch (cause) {
      setAccount(null);
      setError(cause instanceof Error ? cause.message : 'The admin dashboard could not be loaded.');
    } finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const moderateSeller = async (seller: SellerApplication, decision: 'approve' | 'reject' | 'suspend' | 'reinstate') => {
    if (decision !== 'approve' && reason.trim().length < 5) { setError('Enter a reason of at least 5 characters.'); return; }
    setAction(`${decision}-${seller._id}`); setError('');
    try {
      await apiRequest(`/admin/sellers/${seller._id}/${decision}`, { method: 'POST', body: decision === 'approve' || decision === 'reinstate' ? '{}' : JSON.stringify({ reason: reason.trim() }) });
      setReason(''); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Seller action failed.'); }
    finally { setAction(''); }
  };
  const moderateProduct = async (product: Product, decision: 'approve' | 'reject') => {
    if (decision === 'reject' && reason.trim().length < 5) { setError('Enter a reason of at least 5 characters.'); return; }
    setAction(`${decision}-${product._id}`); setError('');
    try { await apiRequest(`/admin/products/${product._id}/${decision}`, { method: 'POST', body: JSON.stringify({ reason: reason.trim() || 'Listing reviewed against marketplace standards.' }) }); setReason(''); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Product action failed.'); }
    finally { setAction(''); }
  };
  const updateOrder = async (order: Order, status: 'processing' | 'shipped' | 'delivered') => {
    setAction(order._id); setError('');
    try { const result = await apiRequest<{ order: Order }>(`/orders/admin/${order._id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason: 'Admin dashboard oversight.' }) }); setOrders((current) => current.map((item) => item._id === order._id ? result.order : item)); setSelectedOrder(result.order); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Order status update failed.'); }
    finally { setAction(''); }
  };

  if (busy) return <section className="mx-auto min-h-[60vh] max-w-6xl px-6 py-24 text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin" /><p role="status" className="mt-4 text-sm text-luxury-gray">Loading admin workspace…</p></section>;
  if (!account || error && !overview) return <section className="mx-auto min-h-[60vh] max-w-2xl px-6 py-24 text-center"><ShieldAlert className="mx-auto h-8 w-8" /><h1 className="mt-4 font-serif text-3xl">Admin access required</h1><p role="alert" className="mt-3 text-sm text-luxury-gray">{error || 'This workspace is restricted.'}</p><button onClick={() => setView('home')} className="mt-6 underline">Return to storefront</button></section>;

  return <section className="mx-auto min-h-[60vh] max-w-7xl px-5 py-10 md:px-12 md:py-16">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-luxury-border pb-6"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-luxury-gray">Restricted workspace</p><h1 className="mt-2 font-serif text-3xl">Admin dashboard</h1></div><button onClick={() => void load()} className="inline-flex min-h-10 items-center gap-2 text-xs underline"><RefreshCw className="h-4 w-4" /> Refresh</button></div>
    {error && <p role="alert" className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
    <nav className="mt-6 flex flex-wrap gap-2" aria-label="Admin sections">{(['overview', 'sellers', 'products', 'orders', 'payments'] as Tab[]).map((item) => <button key={item} onClick={() => setTab(item)} className={`min-h-10 px-4 text-xs uppercase tracking-wider ${tab === item ? 'bg-luxury-charcoal text-white' : 'border border-luxury-border'}`}>{item}</button>)}</nav>
    {tab === 'overview' && overview && <OverviewPanel overview={overview} />}
    {tab === 'sellers' && <SellerPanel sellers={sellers} action={action} reason={reason} setReason={setReason} onAction={moderateSeller} />}
    {tab === 'products' && <ProductPanel products={products} action={action} reason={reason} setReason={setReason} onAction={moderateProduct} />}
    {tab === 'orders' && <OrderPanel orders={orders} selected={selectedOrder} setSelected={setSelectedOrder} action={action} onUpdate={updateOrder} />}
    {tab === 'payments' && <PaymentPanel payments={payments} overview={overview} />}
  </section>;
}

function OverviewPanel({ overview }: { overview: Overview }) {
  const labels: Record<string, string> = { users: 'Users', sellers: 'Sellers', products: 'Products', orders: 'Orders', pendingApplications: 'Pending sellers', pendingProducts: 'Pending listings', unpaidOrders: 'Unpaid orders', paymentAttempts: 'Payment attempts' };
  return <div className="mt-8"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Object.entries(overview.counts).map(([key, value]) => <div key={key} className="border border-luxury-border p-5"><p className="text-xs text-luxury-gray">{labels[key] || key}</p><p className="mt-2 font-mono text-2xl">{value}</p></div>)}</div><div className="mt-8 border border-luxury-border p-6"><h2 className="font-serif text-xl">Financial allocation</h2><div className="mt-5 grid gap-4 sm:grid-cols-3"><Metric label="Captured" value={overview.finance.capturedPaise} /><Metric label="Platform commission · 20%" value={overview.finance.platformCommissionPaise} /><Metric label="Seller share · 80%" value={overview.finance.sellerSharePaise} /></div><p className="mt-5 text-xs text-luxury-gray">Provider: {overview.paymentProvider}. Payment collection remains disabled; values reflect provider-confirmed financial events only.</p></div></div>;
}
function Metric({ label, value }: { label: string; value: number }) { return <div><p className="text-xs text-luxury-gray">{label}</p><p className="mt-1 font-mono">{formatINR(value / 100, true)}</p></div>; }
function SellerPanel({ sellers, action, reason, setReason, onAction }: { sellers: SellerApplication[]; action: string; reason: string; setReason: (value: string) => void; onAction: (seller: SellerApplication, decision: 'approve' | 'reject' | 'suspend' | 'reinstate') => void }) { return <Panel title="Seller management" empty={!sellers.length} emptyText="No seller applications."><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for rejection or suspension" className="mb-5 min-h-20 w-full border border-luxury-border bg-transparent p-3 text-sm" />{sellers.map((seller) => <div key={seller._id} className="flex flex-wrap items-center justify-between gap-4 border-t border-luxury-border py-5"><div><p className="font-serif text-lg">{seller.displayName}</p><p className="text-xs text-luxury-gray">{seller.user?.name} · {seller.user?.email} · {seller.status}</p></div><div className="flex flex-wrap gap-2">{seller.status === 'pending' && <><Action label="Approve" icon={<Check />} disabled={!!action} onClick={() => onAction(seller, 'approve')} /><Action label="Reject" icon={<X />} disabled={!!action} onClick={() => onAction(seller, 'reject')} /></>}{seller.status === 'approved' && <Action label="Suspend" icon={<ShieldAlert />} disabled={!!action} onClick={() => onAction(seller, 'suspend')} />}{seller.status === 'suspended' && <Action label="Reinstate" icon={<Check />} disabled={!!action} onClick={() => onAction(seller, 'reinstate')} />}</div></div>)}</Panel>; }
function ProductPanel({ products, action, reason, setReason, onAction }: { products: Product[]; action: string; reason: string; setReason: (value: string) => void; onAction: (product: Product, decision: 'approve' | 'reject') => void }) { return <Panel title="Product moderation" empty={!products.length} emptyText="No listings awaiting review."><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for rejection, or optional approval note" className="mb-5 min-h-20 w-full border border-luxury-border bg-transparent p-3 text-sm" />{products.map((product) => <div key={product._id} className="flex flex-wrap items-center justify-between gap-4 border-t border-luxury-border py-5"><div><p className="font-serif text-lg">{product.title}</p><p className="text-xs text-luxury-gray">{product.seller?.name} · {formatINR(product.pricePaise / 100, true)}</p></div><div className="flex gap-2"><Action label="Approve" icon={<Check />} disabled={!!action} onClick={() => onAction(product, 'approve')} /><Action label="Reject" icon={<X />} disabled={!!action} onClick={() => onAction(product, 'reject')} /></div></div>)}</Panel>; }
function OrderPanel({ orders, selected, setSelected, action, onUpdate }: { orders: Order[]; selected: Order | null; setSelected: (order: Order | null) => void; action: string; onUpdate: (order: Order, status: 'processing' | 'shipped' | 'delivered') => void }) { return <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]"><Panel title="Orders" empty={!orders.length} emptyText="No orders found.">{orders.map((order) => <button key={order._id} onClick={() => setSelected(order)} className="block w-full border-t border-luxury-border py-4 text-left"><p className="font-mono text-sm">{order.orderNumber}</p><p className="mt-1 text-xs text-luxury-gray">{order.buyer?.email} · {order.status} · {order.paymentStatus}</p><p className="mt-1 font-mono text-sm">{formatINR(order.totalPaise / 100, true)}</p></button>)}</Panel>{selected ? <div className="h-fit border border-luxury-border p-5"><h2 className="font-serif text-xl">{selected.orderNumber}</h2><p className="mt-2 text-sm">{selected.buyer?.name} · {selected.seller?.name}</p><p className="mt-3 text-xs text-luxury-gray">Payment: {selected.paymentStatus}</p><div className="mt-5 flex flex-wrap gap-2">{(['processing', 'shipped', 'delivered'] as const).map((status) => <Action key={status} label={status} disabled={!!action || selected.paymentStatus !== 'paid'} onClick={() => onUpdate(selected, status)} />)}</div><h3 className="mt-6 font-serif text-lg">Audit history</h3>{selected.statusHistory?.length ? <ul className="mt-3 space-y-3 text-xs">{selected.statusHistory.map((entry, index) => <li key={index} className="border-t border-luxury-border pt-3">{entry.fromStatus} → {entry.toStatus}<br /><span className="text-luxury-gray">{entry.reason || entry.action} · {new Date(entry.at).toLocaleString()}</span></li>)}</ul> : <p className="mt-3 text-xs text-luxury-gray">No status changes recorded.</p>}</div> : <div className="border border-dashed border-luxury-border p-8 text-sm text-luxury-gray">Select an order to inspect details.</div>}</div>; }
function PaymentPanel({ payments, overview }: { payments: Array<{ _id: string; amountPaise: number; status: string; provider: string; createdAt: string }>; overview: Overview | null }) { return <Panel title="Payment attempts and reconciliation" empty={!payments.length} emptyText="No payment attempts recorded."><p className="mb-5 text-xs text-luxury-gray">Payment provider is disabled. Sensitive provider credentials and session tokens are never displayed.</p>{payments.map((payment) => <div key={payment._id} className="flex flex-wrap justify-between gap-3 border-t border-luxury-border py-4 text-sm"><span>{payment.provider} · {payment.status} · {new Date(payment.createdAt).toLocaleDateString()}</span><span className="font-mono">{formatINR(payment.amountPaise / 100, true)}</span></div>)}{overview && <div className="mt-5 border-t border-luxury-border pt-5 text-sm">Captured: {formatINR(overview.finance.capturedPaise / 100, true)} · Commission: {formatINR(overview.finance.platformCommissionPaise / 100, true)} · Seller: {formatINR(overview.finance.sellerSharePaise / 100, true)}</div>}</Panel>; }
function Panel({ title, empty, emptyText, children }: { title: string; empty: boolean; emptyText: string; children: React.ReactNode }) { return <div className="mt-8 border border-luxury-border p-5 sm:p-7"><h2 className="font-serif text-xl">{title}</h2>{empty ? <div className="mt-6 flex items-center gap-2 text-sm text-luxury-gray"><AlertCircle className="h-4 w-4" />{emptyText}</div> : <div className="mt-5">{children}</div>}</div>; }
function Action({ label, icon, disabled, onClick }: { label: string; icon?: React.ReactNode; disabled?: boolean; onClick: () => void; key?: React.Key }) { return <button type="button" disabled={disabled} onClick={onClick} className="inline-flex min-h-9 items-center gap-1 border border-luxury-border px-3 text-xs capitalize disabled:opacity-40">{icon && React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'h-3.5 w-3.5' })}{label}</button>; }
