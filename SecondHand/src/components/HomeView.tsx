import React from 'react';
import { ViewState, Product } from '../types';
import { products } from '../data';
import { ArrowRight } from 'lucide-react';

interface HomeViewProps {
  setView: (view: ViewState) => void;
  setSelectedProduct: (product: Product) => void;
  onSelectCategory: (category: string) => void;
}

export default function HomeView({ setView, setSelectedProduct, onSelectCategory }: HomeViewProps) {
  const categories = [
    { label: 'Skirts', image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=900&q=85' },
    { label: 'Tops', image: 'https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&w=900&q=85' },
    { label: 'Dresses', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=900&q=85' },
    { label: 'Men', image: new URL('../../assets/images/pant1.png', import.meta.url).href },
  ];
  return <div className="pb-16">
    <section className="relative flex min-h-[520px] items-end overflow-hidden bg-[#59483e] md:min-h-[640px]">
      <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=90" alt="A rack of clothes ready for a new home" className="absolute inset-0 h-full w-full object-cover opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      <div className="relative mx-auto w-full max-w-7xl px-6 pb-14 pt-32 text-white md:px-12 md:pb-20">
        <p className="mb-4 text-xs uppercase tracking-[0.24em]">A little shop for pre-loved clothes</p>
        <h2 className="max-w-2xl font-serif text-5xl leading-tight sm:text-6xl">Good clothes deserve another outing.</h2>
        <p className="mt-5 max-w-lg text-sm leading-6 text-white/85">Browse pre-loved skirts, tops, dresses and men’s pieces. Free shipping on orders over ₹900.</p>
        <button onClick={() => setView('shop')} className="mt-8 inline-flex items-center gap-3 bg-[#f8f2e9] px-6 py-4 text-xs font-semibold uppercase tracking-widest text-[#302820]">Browse the collection <ArrowRight className="h-4 w-4" /></button>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-20">
      <div className="mb-8 flex items-end justify-between border-b border-luxury-border pb-5">
        <div><p className="text-xs uppercase tracking-[0.18em] text-luxury-gray">Find your kind of thing</p><h3 className="mt-2 font-serif text-3xl">Shop by category</h3></div>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">{categories.map(({ label, image }) => <button key={label} onClick={() => onSelectCategory(label)} className="group relative aspect-[4/5] overflow-hidden bg-[#e9e2d8] text-left" aria-label={`Shop ${label}`}><img src={image} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"/><span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-5 pb-5 pt-16 font-serif text-2xl text-white">{label}<ArrowRight className="ml-3 inline h-4 w-4"/></span></button>)}</div>
    </section>
    <section className="mx-auto max-w-7xl px-6 pb-8 md:px-12">
      <div className="mb-8 flex items-end justify-between border-b border-luxury-border pb-5"><div><p className="text-xs uppercase tracking-[0.18em] text-luxury-gray">Fresh from GOSH</p><h3 className="mt-2 font-serif text-3xl">The little edit</h3></div><button onClick={() => setView('shop')} className="inline-flex items-center gap-2 text-xs uppercase tracking-wider">See all <ArrowRight className="h-4 w-4"/></button></div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{products.map((product) => <article key={product.id} className="group"><div className="relative aspect-[3/4] overflow-hidden bg-[#eee8df]"><button className="h-full w-full" onClick={() => {setSelectedProduct(product);setView('detail');}}><img src={product.image} alt={product.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"/></button>{product.isSoldOut && <span className="absolute inset-x-0 bottom-0 bg-black/75 py-3 text-center font-mono text-xs font-semibold tracking-[0.2em] text-white">SOLD OUT</span>}</div><button onClick={() => {setSelectedProduct(product);setView('detail');}} className="mt-3 text-left"><span className="text-[10px] uppercase tracking-[0.16em] text-luxury-gray">{product.subcategory} · Size {product.sizeLabel || product.size}</span><h4 className="mt-1 font-serif text-lg">{product.title}</h4><p className="mt-1 text-xs text-luxury-gray">{product.description}</p><p className="mt-1 text-xs text-luxury-gray">{product.price > 0 ? `₹${product.price}` : 'Price to be added'} · Shipping extra</p></button></article>)}</div>
    </section>
  </div>;
}
