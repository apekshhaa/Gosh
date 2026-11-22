import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ViewState, Product, CartItem } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import HomeView from './components/HomeView';
import ShopView from './components/ShopView';
import ProductDetailView from './components/ProductDetailView';
import WomensView from './components/WomensView';
import WishlistView from './components/WishlistView';
import CartView from './components/CartView';
import AboutView from './components/AboutView';
import SellerStudioView from './components/SellerStudioView';
import OrdersView from './components/OrdersView';
import CheckoutView from './components/CheckoutView';
import AdminDashboard from './components/AdminDashboard';
import LoginView from './components/LoginView';
import { products } from './data';
import { getPublicProduct, getPublicProducts } from './api/products';
import { motion, AnimatePresence } from 'motion/react';

type Route = { view: ViewState; product?: Product; productId?: string; query?: string; category?: string; invalid?: boolean };
const PRODUCT_PATH = /^\/products\/([^/]+)\/?$/;
const ORDER_PATH = /^\/orders\/([^/]+)\/?$/;

function routeFromLocation(): Route {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const query = new URLSearchParams(window.location.search).get('q') || '';
  const category = new URLSearchParams(window.location.search).get('category') || 'All';
  if (path === '/') return { view: 'home' };
  if (path === '/shop') return { view: 'shop', query, category };
  if (path === '/women') return { view: 'womens' };
  if (path === '/wishlist') return { view: 'wishlist' };
  if (path === '/cart') return { view: 'cart' };
  if (path === '/checkout') return { view: 'checkout' };
  if (path === '/about') return { view: 'about' };
  if (path === '/seller') return { view: 'seller' };
  if (path === '/admin') return { view: 'admin' };
  if (path === '/login') return { view: 'login' };
  if (path === '/orders') return { view: 'orders' };
  const orderMatch = path.match(ORDER_PATH);
  if (orderMatch) return { view: 'orders', productId: decodeURIComponent(orderMatch[1]) };
  const match = path.match(PRODUCT_PATH);
  if (match) {
    const product = products.find((item) => item.id === decodeURIComponent(match[1]));
    return product ? { view: 'detail', product } : /^[a-f\d]{24}$/i.test(decodeURIComponent(match[1])) ? { view: 'detail', productId: decodeURIComponent(match[1]) } : { view: 'detail', invalid: true };
  }
  return { view: 'home', invalid: true };
}

function safeRead<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function routePath(view: ViewState, product: Product | null, query: string, category: string) {
  if (view === 'detail' && product) return `/products/${encodeURIComponent(product.id)}`;
  if (view === 'shop') {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category !== 'All') params.set('category', category);
    return params.size ? `/shop?${params.toString()}` : '/shop';
  }
  const paths: Partial<Record<ViewState, string>> = {
    home: '/', womens: '/women', wishlist: '/wishlist', cart: '/cart', checkout: '/checkout', about: '/about', seller: '/seller', orders: '/orders', admin: '/admin', login: '/login'
  };
  return paths[view] || '/';
}

export default function App() {
  const initialRoute = useMemo(routeFromLocation, []);
  const [currentView, setCurrentView] = useState<ViewState>(initialRoute.view);
  const [selectedProduct, setSelectedProductState] = useState<Product | null>(initialRoute.product || null);
  const [detailProductId, setDetailProductId] = useState(initialRoute.productId || initialRoute.product?.id || '');
  const [orderId, setOrderId] = useState(initialRoute.view === 'orders' ? initialRoute.productId : undefined);
  const [detailLoading, setDetailLoading] = useState(Boolean(initialRoute.productId));
  const [detailError, setDetailError] = useState('');
  const [apiProducts, setApiProducts] = useState<Product[]>([]);
  const [apiState, setApiState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retryProducts, setRetryProducts] = useState(0);
  const [storageHydrated, setStorageHydrated] = useState(false);
  const catalogProducts = useMemo(() => {
    const ids = new Set(apiProducts.map((product) => product.id));
    return [...apiProducts, ...products.filter((product) => !ids.has(product.id))];
  }, [apiProducts]);
  const selectedProductRef = useRef<Product | null>(initialRoute.product || null);
  const [searchQuery, setSearchQuery] = useState(initialRoute.query || '');
  const queryRef = useRef(initialRoute.query || '');
  const [shopCategory, setShopCategory] = useState(initialRoute.category || 'All');
  const shopCategoryRef = useRef(initialRoute.category || 'All');
  const [invalidRoute, setInvalidRoute] = useState(Boolean(initialRoute.invalid));
  const [notice, setNotice] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = safeRead<string | null>('gosh-theme', null);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [hasManualTheme, setHasManualTheme] = useState(() => {
    const saved = safeRead<string | null>('gosh-theme', null);
    return saved === 'light' || saved === 'dark';
  });
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    const ids = safeRead<string[]>('gosh-wishlist', []);
    return products.filter((product) => ids.includes(product.id));
  });
  const [cart, setCart] = useState<CartItem[]>(() => {
    const entries = safeRead<Array<{ productId: string; selectedSize?: CartItem['selectedSize'] }>>('gosh-cart', []);
    return entries.flatMap((entry) => {
      const product = products.find((item) => item.id === entry.productId);
      if (!product || product.isSoldOut || product.price <= 0) return [];
      return [{ product, quantity: 1, selectedSize: entry.selectedSize || product.size }];
    });
  });
  const cartRef = useRef(cart);
  const wishlistRef = useRef(wishlist);

  const setSelectedProduct = useCallback((product: Product) => {
    selectedProductRef.current = product;
    setDetailProductId(product.id);
    setSelectedProductState(product);
  }, []);

  const setView = useCallback((view: ViewState) => {
    const nextPath = routePath(view, selectedProductRef.current, queryRef.current, shopCategoryRef.current);
    if (currentView === 'shop' && view === 'detail') {
      try { window.sessionStorage.setItem('gosh-shop-scroll', String(window.scrollY)); } catch { /* Session storage may be unavailable. */ }
    }
    if (window.location.pathname + window.location.search !== nextPath) {
      window.history.pushState({ gosh: true }, '', nextPath);
    }
    setCurrentView(view);
    if (view === 'orders') setOrderId(undefined);
    setInvalidRoute(false);
    if (view !== 'detail') selectedProductRef.current = selectedProduct;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView, selectedProduct]);

  const openOrder = useCallback((id: string) => { setOrderId(id || undefined); const path = id ? `/orders/${encodeURIComponent(id)}` : '/orders'; if (window.location.pathname !== path) window.history.pushState({ gosh: true }, '', path); setCurrentView('orders'); window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  useEffect(() => {
    const syncRoute = () => {
      const route = routeFromLocation();
      setCurrentView(route.view);
      setOrderId(route.view === 'orders' ? route.productId : undefined);
      setInvalidRoute(Boolean(route.invalid));
      queryRef.current = route.query || '';
      setSearchQuery(route.query || '');
      shopCategoryRef.current = route.category || 'All';
      setShopCategory(route.category || 'All');
      if (route.product) setSelectedProduct(route.product);
      else if (route.productId) { setDetailProductId(route.productId); setSelectedProductState(null); }
      if (route.view === 'shop') {
        let savedScroll = 0;
        try { savedScroll = Number(window.sessionStorage.getItem('gosh-shop-scroll') || 0); } catch { /* Session storage may be unavailable. */ }
        window.requestAnimationFrame(() => window.scrollTo({ top: savedScroll }));
      } else window.scrollTo({ top: 0 });
    };
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, [setSelectedProduct]);

  useEffect(() => {
    let cancelled = false;
    setApiState('loading');
    getPublicProducts().then((items) => {
      if (cancelled) return;
      setApiProducts(items);
      setApiState('ready');
    }).catch(() => { if (!cancelled) setApiState('error'); }).finally(() => { if (!cancelled) setStorageHydrated(true); });
    return () => { cancelled = true; };
  }, [retryProducts]);

  useEffect(() => {
    const id = currentView === 'detail' ? detailProductId : '';
    if (!/^[a-f\d]{24}$/i.test(id)) { setDetailLoading(false); return; }
    let cancelled = false;
    setDetailLoading(true);
    setDetailError('');
    getPublicProduct(id).then((product) => {
      if (cancelled) return;
      setSelectedProductState(product);
      selectedProductRef.current = product;
      setInvalidRoute(false);
      setDetailLoading(false);
    }).catch((error: unknown) => {
      if (cancelled) return;
      setDetailLoading(false);
      setDetailError(error instanceof Error ? error.message : 'Product details are unavailable.');
      if (!selectedProductRef.current) setInvalidRoute(true);
    });
    return () => { cancelled = true; };
  }, [currentView, detailProductId]);

  useEffect(() => {
    if (apiState !== 'ready') return;
    const savedWishlist = safeRead<string[]>('gosh-wishlist', []);
    const wishlistItems = catalogProducts.filter((product) => savedWishlist.includes(product.id));
    wishlistRef.current = wishlistItems; setWishlist(wishlistItems);
    const savedCart = safeRead<Array<{ productId: string; selectedSize?: string }>>('gosh-cart', []);
    const cartItems = savedCart.flatMap((entry) => {
      const product = catalogProducts.find((item) => item.id === entry.productId);
      return !product || product.isSoldOut || product.price <= 0 ? [] : [{ product, quantity: 1, selectedSize: entry.selectedSize || product.size }];
    });
    cartRef.current = cartItems; setCart(cartItems);
  }, [apiState, catalogProducts]);

  useEffect(() => {
    if (!storageHydrated) return;
    try { window.localStorage.setItem('gosh-cart', JSON.stringify(cart.map(({ product, selectedSize }) => ({ productId: product.id, selectedSize })))); } catch { /* Storage may be unavailable in private browsing. */ }
  }, [cart, storageHydrated]);
  useEffect(() => {
    if (!storageHydrated) return;
    try { window.localStorage.setItem('gosh-wishlist', JSON.stringify(wishlist.map((product) => product.id))); } catch { /* Storage may be unavailable in private browsing. */ }
  }, [wishlist, storageHydrated]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (hasManualTheme) {
      try { window.localStorage.setItem('gosh-theme', theme); } catch { /* Storage may be unavailable in private browsing. */ }
    }
  }, [theme, hasManualTheme]);
  useEffect(() => {
    if (hasManualTheme) return;
    const preference = window.matchMedia('(prefers-color-scheme: dark)');
    const applySystemTheme = (event: MediaQueryListEvent) => setTheme(event.matches ? 'dark' : 'light');
    preference.addEventListener('change', applySystemTheme);
    return () => preference.removeEventListener('change', applySystemTheme);
  }, [hasManualTheme]);
  useEffect(() => {
    const name = currentView === 'detail' && selectedProduct ? selectedProduct.title : currentView === 'home' ? 'Pre-loved clothing' : currentView;
    document.title = `${name.charAt(0).toUpperCase()}${name.slice(1)} | GOSH`;
    const description = currentView === 'detail' && selectedProduct
      ? `${selectedProduct.title} by ${selectedProduct.brand}. ${selectedProduct.description} Price ${selectedProduct.price ? `₹${selectedProduct.price}` : 'to be added'}.`
      : 'Shop pre-loved finds or list your own clothes for a second life at GOSH.';
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#1d1b19' : '#f4eee6');
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', `${name} | GOSH`);
  }, [currentView, selectedProduct, theme]);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const onSearch = (query: string) => {
    queryRef.current = query.trim();
    setSearchQuery(query.trim());
    shopCategoryRef.current = 'All';
    setShopCategory('All');
  };
  const toggleWishlist = (product: Product) => {
    const isSaved = wishlistRef.current.some((item) => item.id === product.id);
    const nextWishlist = isSaved ? wishlistRef.current.filter((item) => item.id !== product.id) : [...wishlistRef.current, product];
    wishlistRef.current = nextWishlist;
    setWishlist(nextWishlist);
    setNotice(isSaved ? `${product.title} removed from your wishlist.` : `${product.title} saved to your wishlist.`);
  };
  const addToCart = (product: Product) => {
    if (product.isSoldOut) {
      setNotice(`${product.title} is sold out.`);
      return;
    }
    if (product.price <= 0) {
      setNotice(`${product.title} is not ready to order yet. Contact GOSH for its price.`);
      return;
    }
    if (cartRef.current.some((item) => item.product.id === product.id)) {
      setNotice(`${product.title} is already in your bag. Each pre-loved item is one of a kind.`);
      return;
    }
    const nextCart = [...cartRef.current, { product, quantity: 1, selectedSize: product.size }];
    cartRef.current = nextCart;
    setCart(nextCart);
    setNotice(`${product.title} added to your bag.`);
  };
  const removeFromCart = (productId: string) => {
    const nextCart = cartRef.current.filter((item) => item.product.id !== productId);
    cartRef.current = nextCart;
    setCart(nextCart);
  };
  const clearCart = () => { cartRef.current = []; setCart([]); };
  const toggleTheme = () => { setHasManualTheme(true); setTheme((value) => value === 'light' ? 'dark' : 'light'); };

  return (
    <div className="flex min-h-screen flex-col bg-luxury-sand text-luxury-charcoal selection:bg-luxury-charcoal selection:text-white">
      <a href="#main-content" className="sr-only fixed left-3 top-3 z-[100] bg-luxury-sand px-4 py-3 text-sm focus:not-sr-only">Skip to content</a>
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-[#57443b] px-4 py-2 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-white">
        <span>Shipping charged separately · Free shipping on orders over ₹900</span><span aria-hidden="true">·</span>
        <button onClick={() => setView('seller')} className="min-h-6 font-semibold underline underline-offset-2">Sell with GOSH</button><span aria-hidden="true">·</span>
        <a href="https://wa.me/917338546697" target="_blank" rel="noreferrer" className="min-h-6 underline underline-offset-2">WhatsApp 7338546697</a>
      </div>
      <Header currentView={currentView} setView={setView} onSearch={(query) => { onSearch(query); setView('shop'); }} searchQuery={searchQuery} cartCount={cart.length} wishlistCount={wishlist.length} theme={theme} onToggleTheme={toggleTheme} />
      {notice && <div role="status" aria-live="polite" className="fixed right-4 top-28 z-[70] max-w-sm border border-luxury-border bg-luxury-sand px-4 py-3 text-sm shadow-lg">{notice}</div>}
      <main className="flex-grow" id="main-content" tabIndex={-1}>
        {invalidRoute ? (
          <section className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-luxury-gray">404 · Page not found</p>
            <h1 className="mt-3 font-serif text-3xl">We couldn’t find that page.</h1>
            <p className="mt-3 text-sm text-luxury-gray">The link may be outdated or the item may no longer be listed.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3"><button onClick={() => setView('home')} className="min-h-11 bg-luxury-charcoal px-5 text-sm text-white">Go home</button><button onClick={() => setView('shop')} className="min-h-11 border border-luxury-charcoal px-5 text-sm">Browse the collection</button></div>
          </section>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={currentView} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {currentView === 'home' && <HomeView products={catalogProducts} setView={setView} setSelectedProduct={setSelectedProduct} onSelectCategory={(category) => { if (category === 'Women') setView('womens'); else { shopCategoryRef.current = category; setShopCategory(category); setView('shop'); } }} />}
              {currentView === 'shop' && <ShopView products={catalogProducts} dataState={apiState} onRetry={() => setRetryProducts((value) => value + 1)} setView={setView} setSelectedProduct={setSelectedProduct} initialSearchQuery={searchQuery} initialCategory={shopCategory} clearSearchQuery={() => { onSearch(''); window.history.replaceState(window.history.state, '', routePath('shop', selectedProductRef.current, '', shopCategoryRef.current)); }} wishlist={wishlist} onToggleWishlist={toggleWishlist} />}
              {currentView === 'womens' && <WomensView products={catalogProducts} setView={setView} setSelectedProduct={setSelectedProduct} onToggleWishlist={toggleWishlist} wishlist={wishlist} />}
              {currentView === 'detail' && selectedProduct && <ProductDetailView products={catalogProducts} product={selectedProduct} setView={setView} setSelectedProduct={setSelectedProduct} onBack={() => window.history.state?.gosh ? window.history.back() : setView('shop')} onAddToCart={addToCart} isWishlisted={wishlist.some((item) => item.id === selectedProduct.id)} onToggleWishlist={() => toggleWishlist(selectedProduct)} />}
              {currentView === 'detail' && !selectedProduct && detailLoading && <p className="mx-auto max-w-7xl px-6 py-24 text-center text-sm text-luxury-gray" role="status">Loading this listing…</p>}
              {currentView === 'detail' && detailError && selectedProduct && <p className="mx-auto max-w-7xl px-6 py-4 text-sm text-luxury-gray" role="status">Showing saved listing details; the latest listing could not be loaded.</p>}
              {currentView === 'wishlist' && <WishlistView wishlist={wishlist} setView={setView} setSelectedProduct={setSelectedProduct} onRemoveFromWishlist={(product) => toggleWishlist(product)} onMoveToBag={(product) => { if (product.isSoldOut || product.price <= 0) return; addToCart(product); setView('cart'); }} />}
              {currentView === 'cart' && <CartView cart={cart} setView={setView} setSelectedProduct={setSelectedProduct} onRemoveItem={(id) => removeFromCart(id)} />}
              {currentView === 'checkout' && <CheckoutView cart={cart} setView={setView} setSelectedProduct={setSelectedProduct} onRemoveItem={removeFromCart} onOrderCreated={(id) => { clearCart(); openOrder(id); }} />}
              {currentView === 'login' && <LoginView setView={setView} />}
              {currentView === 'about' && <AboutView setView={setView} />}
              {currentView === 'seller' && <SellerStudioView setView={setView} />}
              {currentView === 'admin' && <AdminDashboard setView={setView} />}
              {currentView === 'orders' && <OrdersView orderId={orderId} setOrderId={openOrder} setView={setView} />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
      <Footer setView={setView} />
    </div>
  );
}
