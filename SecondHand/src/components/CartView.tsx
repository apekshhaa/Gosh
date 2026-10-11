import React from 'react';
import { ViewState, CartItem, Product } from '../types';
import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { formatINR } from '../utils/currency';

interface CartViewProps {
  cart: CartItem[];
  setView: (view: ViewState) => void;
  setSelectedProduct: (product: Product) => void;
  onRemoveItem: (productId: string, size: CartItem['selectedSize']) => void;
}

export default function CartView({ cart, setView, setSelectedProduct, onRemoveItem }: CartViewProps) {
  const subtotal = cart.reduce((sum, item) => sum + item.product.price, 0);
  const orderMessage = [
    'Hi GOSH, I would like to order:',
    ...cart.map(({ product, selectedSize }) => `• ${product.title} — size ${product.sizeLabel || selectedSize} — ${formatINR(product.price)}`),
    `Subtotal: ${formatINR(subtotal)}`,
    'Please confirm availability and shipping.'
  ].join('\n');
  const orderUrl = `https://wa.me/917338546697?text=${encodeURIComponent(orderMessage)}`;

  return <section className="min-h-[60vh] bg-luxury-sand px-5 py-10 text-left sm:px-6 md:px-12 md:py-16">
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-luxury-border pb-5">
        <div><h1 className="font-serif text-3xl font-light uppercase tracking-tight md:text-4xl">Shopping bag</h1><p className="mt-2 text-xs text-luxury-gray">One of a kind pieces are limited to one of each item.</p></div>
        <span className="font-mono text-xs text-luxury-gray">{cart.length} {cart.length === 1 ? 'item' : 'items'}</span>
      </div>

      {cart.length === 0 ? <div className="mx-auto flex max-w-lg flex-col items-center border border-dashed border-luxury-border px-6 py-16 text-center">
        <p className="font-serif text-xl">Your bag is empty.</p><p className="mt-2 text-sm text-luxury-gray">Browse the collection to find something you love.</p>
        <button onClick={() => setView('shop')} className="mt-6 inline-flex min-h-11 items-center gap-2 bg-luxury-charcoal px-5 text-xs font-semibold uppercase tracking-wider text-white">Continue shopping <ArrowRight className="h-4 w-4" /></button>
      </div> : <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <ul className="space-y-4">
          {cart.map((item) => <li key={item.product.id} className="flex gap-4 border border-luxury-border bg-[#FBFBFA] p-3 sm:gap-5 sm:p-4">
            <button onClick={() => { setSelectedProduct(item.product); setView('detail'); }} className="h-32 w-24 shrink-0 overflow-hidden bg-luxury-sand sm:h-40 sm:w-32" aria-label={`View ${item.product.title}`}><img src={item.product.image} alt={item.product.title} loading="lazy" className="h-full w-full object-cover" /></button>
            <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
              <div><p className="text-[10px] uppercase tracking-widest text-luxury-gray">{item.product.brand}</p><button onClick={() => { setSelectedProduct(item.product); setView('detail'); }} className="mt-1 text-left font-serif text-lg hover:underline">{item.product.title}</button><p className="mt-2 text-xs text-luxury-gray">Size: {item.product.sizeLabel || item.selectedSize} · Qty: 1</p></div>
              <div className="flex items-end justify-between gap-2"><span className="font-mono text-sm font-semibold">{formatINR(item.product.price)}</span><button onClick={() => onRemoveItem(item.product.id, item.selectedSize)} className="inline-flex min-h-10 items-center gap-1.5 px-2 text-xs text-luxury-gray underline underline-offset-4 hover:text-red-700" aria-label={`Remove ${item.product.title} from bag`}><Trash2 className="h-4 w-4" /> Remove</button></div>
            </div>
          </li>)}
        </ul>

        <aside className="h-fit border border-luxury-border bg-[#FBFBFA] p-5">
          <h2 className="font-serif text-xl">Order summary</h2>
          <div className="mt-5 flex justify-between border-b border-luxury-border pb-4 text-sm"><span>Subtotal</span><span className="font-mono font-semibold">{formatINR(subtotal)}</span></div>
          <p className="mt-4 text-xs leading-5 text-luxury-gray">Shipping is calculated separately and confirmed with you before the order is final. Free shipping applies over ₹900.</p>
          <a href={orderUrl} target="_blank" rel="noreferrer" className="mt-5 flex min-h-12 items-center justify-center gap-2 bg-luxury-charcoal px-4 text-center text-xs font-semibold uppercase tracking-wider text-white">Ask to order on WhatsApp <ArrowRight className="h-4 w-4" /></a>
          <button onClick={() => setView('shop')} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 text-xs text-luxury-gray underline underline-offset-4"><ArrowLeft className="h-4 w-4" /> Continue shopping</button>
          <p className="mt-4 text-[11px] leading-4 text-luxury-gray">This request does not take payment or reserve an item. GOSH will confirm availability, shipping, and the final amount.</p>
        </aside>
      </div>}
    </div>
  </section>;
}
