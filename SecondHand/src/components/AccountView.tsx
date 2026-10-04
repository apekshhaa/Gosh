import React, { useState } from 'react';
import { ViewState, Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  History, 
  MapPin, 
  Settings, 
  LogOut, 
  Edit2, 
  Check, 
  Heart, 
  ShoppingBag, 
  ChevronRight, 
  Package, 
  Clock, 
  Truck, 
  ShieldCheck, 
  Sparkles,
  Save,
  Plus,
  Trash2
} from 'lucide-react';
import { productImages } from '../images';
import { formatINR } from '../utils/currency';

interface AccountViewProps {
  setView: (view: ViewState) => void;
  wishlist: Product[];
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product, size: 'XS' | 'S' | 'M' | 'L' | 'XL', quantity: number) => void;
  setSelectedProduct: (product: Product) => void;
  onLogout?: () => void;
  userProfile?: { name: string; email: string } | null;
}

// Fallback high-fidelity wishlist items as shown in the mockup when user's actual wishlist is empty
const fallbackWishlistProducts: Product[] = [
  {
    id: 'wish-cashmere-sweater',
    title: 'Cashmere Knit Sweater',
    brand: 'Minimalist Studio',
    price: 37400,
    image: productImages.cashmereSweater,
    images: [],
    category: 'knitwear',
    subcategory: 'Knitwear',
    size: 'S',
    condition: 'Pristine',
    material: '100% Cashmere',
    description: 'A soft, luxurious cashmere knit sweater displayed in a minimalist, well-lit studio setting.',
    measurements: '',
    shipping: ''
  },
  {
    id: 'wish-linen-blazer',
    title: 'Structured Linen Blazer',
    brand: 'Editorial Archival',
    price: 31500,
    image: productImages.linenBlazer,
    images: [],
    category: 'outerwear',
    subcategory: 'Outerwear',
    size: 'M',
    condition: 'Excellent',
    material: '100% Organic Linen',
    description: 'A structured linen blazer in a muted sage tone, photographed against a stark white background.',
    measurements: '',
    shipping: ''
  },
  {
    id: 'wish-cotton-tee',
    title: 'Essential Cotton Tee',
    brand: 'Basics Atelier',
    price: 7900,
    image: productImages.cottonTee,
    images: [],
    category: 'womens',
    subcategory: 'Tops & Blouses',
    size: 'M',
    condition: 'Pristine',
    material: '100% Organic Cotton',
    description: 'A simple, pristine organic cotton t-shirt in crisp white, laid flat against an off-white surface.',
    measurements: '',
    shipping: ''
  },
  {
    id: 'wish-crossbody-bag',
    title: 'Minimalist Crossbody',
    brand: 'Sartorial Goods',
    price: 23700,
    image: productImages.leatherBag,
    images: [],
    category: 'accessories',
    subcategory: 'Bags',
    size: 'XL',
    condition: 'Pristine',
    material: 'Ethically Sourced Leather',
    description: 'An elegant, minimalist leather crossbody bag in a deep, rich tan hue, presented against a clean bright background.',
    measurements: '',
    shipping: ''
  }
];

export default function AccountView({ 
  setView, 
  wishlist, 
  onToggleWishlist, 
  onAddToCart,
  setSelectedProduct,
  onLogout,
  userProfile
}: AccountViewProps) {
  
  // Sidebar navigation active state
  type Tab = 'profile' | 'orders' | 'addresses' | 'settings';
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Multi-user / active session state mocks
  const [profile, setProfile] = useState({
    name: userProfile?.name || 'Eleanor Vance',
    email: userProfile?.email || 'eleanor.v@example.com',
    memberSince: 'October 2023',
    newsletter: true,
    preferredCurrency: 'INR'
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState(profile.name);
  const [editedEmail, setEditedEmail] = useState(profile.email);

  React.useEffect(() => {
    if (userProfile) {
      setProfile(prev => ({
        ...prev,
        name: userProfile.name,
        email: userProfile.email
      }));
      setEditedName(userProfile.name);
      setEditedEmail(userProfile.email);
    }
  }, [userProfile]);

  // Address entries mock
  const [addresses, setAddresses] = useState([
    {
      id: 'addr-1',
      isDefault: true,
      label: 'Home (Default)',
      fullName: 'Eleanor Vance',
      street: '452 Lafayette Street, Apt 4B',
      city: 'New York',
      state: 'NY',
      zip: '10003',
      country: 'United States'
    },
    {
      id: 'addr-2',
      isDefault: false,
      label: 'Paris Atelier',
      fullName: 'Eleanor Vance',
      street: '18 Rue du Faubourg Saint-Honoré',
      city: 'Paris',
      state: 'Île-de-France',
      zip: '75008',
      country: 'France'
    }
  ]);

  const [newAddress, setNewAddress] = useState({
    label: '',
    fullName: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States'
  });
  const [showAddAddress, setShowAddAddress] = useState(false);

  // Order history entries matching mockups
  const [orders, setOrders] = useState([
    {
      id: 'CL-8924',
      date: 'Oct 12, 2025',
      status: 'Delivered',
      total: 20300,
      item: {
        title: 'Vintage Silk Blouse',
        image: productImages.silkBlouse,
        brand: 'Christian Dior',
        details: 'Muted cream / 100% premium georgette silk'
      },
      tracking: 'DHL-ECO-9830582'
    },
    {
      id: 'CL-8891',
      date: 'Sep 28, 2025',
      status: 'Delivered',
      total: 25700,
      item: {
        title: 'Tailored Wool Trousers',
        image: productImages.woolTrousers,
        brand: 'Yves Saint Laurent',
        details: 'Deep Charcoal / Italian virgin weaving wool'
      },
      tracking: 'DHL-ECO-4905813'
    }
  ]);

  const [selectedInspectOrder, setSelectedInspectOrder] = useState<typeof orders[0] | null>(null);

  // Settings
  const [alertPreference, setAlertPreference] = useState('immediate');
  const [packagingPreference, setPackagingPreference] = useState('eco-pouch');

  // Determine active displayed wishlist products
  const activeWishlist = wishlist.length > 0 ? wishlist : fallbackWishlistProducts;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(prev => ({
      ...prev,
      name: editedName,
      email: editedEmail
    }));
    setIsEditingProfile(false);
  };

  const handleAddNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.label || !newAddress.fullName || !newAddress.street) return;

    setAddresses(prev => [
      ...prev,
      {
        id: 'addr-' + Date.now(),
        isDefault: prev.length === 0,
        ...newAddress
      }
    ]);

    setNewAddress({
      label: '',
      fullName: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'United States'
    });
    setShowAddAddress(false);
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses(prev => prev.filter(addr => addr.id !== id));
  };

  const handleSetDefaultAddress = (id: string) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
  };

  const handleQuickAdd = (product: Product) => {
    onAddToCart(product, 'M', 1);
    // Success notifications usually trigger standard state feedback
    alert(`"${product.title}" has been successfully added to your shopping bag.`);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setView('detail');
  };

  return (
    <div className="bg-[#FAF9F6] text-[#1C1C1C] min-h-screen py-10">
      
      {/* Top Banner section */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-10 pb-6 text-left">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-luxury-border pb-8">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl tracking-tight text-[#1C1C1C] font-semibold leading-tight">
              Welcome back, {profile.name.split(' ')[0]}
            </h1>
            <p className="text-sm md:text-base text-luxury-gray mt-2 font-light">
              Manage your orders, profile attributes, and curated archival wishlist.
            </p>
          </div>
          
          {/* Circular badge indicator mapping to carbon credits */}
          <div className="mt-4 md:mt-0 px-4 py-3 bg-white/70 border border-luxury-border rounded-xl flex items-center space-x-3 text-xs tracking-wide shadow-xs shrink-0 max-w-sm">
            <Sparkles className="h-4 w-4 text-emerald-700 animate-pulse" />
            <div className="text-left font-sans text-[11px]">
              <span className="font-bold text-[#1C1C1C] uppercase block">CAPSULE CLUB MEMBER</span>
              <span className="text-luxury-gray">Eco-Balance: <strong>-42.5kg CO₂</strong> circulations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Layout Grid */}
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Sidebar Panel (Desktop sticky, mobile responsive grid selector) */}
          <aside className="lg:col-span-3 lg:sticky lg:top-28 space-y-4">
            
            {/* Desktop Menu selection list */}
            <div className="bg-white rounded-2xl border border-luxury-border p-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-1">
              
              <button
                onClick={() => { setActiveTab('profile'); setSelectedInspectOrder(null); }}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-all text-xs font-semibold tracking-wider uppercase ${
                  activeTab === 'profile' 
                    ? 'bg-[#1C1C1C] text-white shadow-xs' 
                    : 'text-luxury-gray hover:bg-[#FAF9F6] hover:text-[#1C1C1C]'
                }`}
                id="sidebar-tab-profile"
              >
                <span className="flex items-center gap-2.5">
                  <User className="h-4 w-4 shrink-0" />
                  Profile Overview
                </span>
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              </button>

              <button
                onClick={() => { setActiveTab('orders'); setSelectedInspectOrder(null); }}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-all text-xs font-semibold tracking-wider uppercase ${
                  activeTab === 'orders' 
                    ? 'bg-[#1C1C1C] text-white shadow-xs' 
                    : 'text-luxury-gray hover:bg-[#FAF9F6] hover:text-[#1C1C1C]'
                }`}
                id="sidebar-tab-orders"
              >
                <span className="flex items-center gap-2.5">
                  <History className="h-4 w-4 shrink-0" />
                  Order History
                </span>
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              </button>

              <button
                onClick={() => { setActiveTab('addresses'); setSelectedInspectOrder(null); }}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-all text-xs font-semibold tracking-wider uppercase ${
                  activeTab === 'addresses' 
                    ? 'bg-[#1C1C1C] text-white shadow-xs' 
                    : 'text-luxury-gray hover:bg-[#FAF9F6] hover:text-[#1C1C1C]'
                }`}
                id="sidebar-tab-addresses"
              >
                <span className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 shrink-0" />
                  Saved Addresses
                </span>
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              </button>

              <button
                onClick={() => { setActiveTab('settings'); setSelectedInspectOrder(null); }}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-all text-xs font-semibold tracking-wider uppercase ${
                  activeTab === 'settings' 
                    ? 'bg-[#1C1C1C] text-white shadow-xs' 
                    : 'text-luxury-gray hover:bg-[#FAF9F6] hover:text-[#1C1C1C]'
                }`}
                id="sidebar-tab-settings"
              >
                <span className="flex items-center gap-2.5">
                  <Settings className="h-4 w-4 shrink-0" />
                  Account Settings
                </span>
                <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              </button>

              <div className="border-t border-luxury-border/60 my-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onLogout) {
                      onLogout();
                    } else {
                      setView('home');
                    }
                  }}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-colors text-xs font-bold text-red-700 hover:bg-red-50"
                  id="tab-action-logout"
                >
                  <span className="flex items-center gap-2.5">
                    <LogOut className="h-4 w-4 shrink-0" strokeWidth={2.5} />
                    Logout Session
                  </span>
                </button>
              </div>
            </div>

            {/* Quick Helper Tip card */}
            <div className="bg-[#FAF9F6] rounded-xl border border-luxury-border p-4 text-xs text-luxury-gray text-left leading-relaxed space-y-2">
              <span className="font-semibold text-luxury-charcoal flex items-center gap-1.5 uppercase font-mono tracking-wider text-[9px]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-800" />
                Studio Security
              </span>
              <p>Your address hashes are stored natively with decentralized encryption. We never expose private purchase parameters to external brokers.</p>
            </div>
          </aside>

          {/* RIGHT: Dashboard Active Content Panels */}
          <main className="lg:col-span-9 space-y-8 text-left">
            
            {/* ANCHOR: Tab - Profile */}
            {activeTab === 'profile' && !selectedInspectOrder && (
              <div className="space-y-6">
                
                {/* Profile Overview Bento grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Card 1: Profile Info box */}
                  <div className="bg-white rounded-2xl border border-luxury-border p-6 md:p-8 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between border-b border-light-gray pb-4 mb-5">
                      <h3 className="font-serif text-lg font-medium text-[#1C1C1C] flex items-center gap-2">
                        <User className="h-4 w-4 text-luxury-gray" />
                        Profile Details
                      </h3>
                      
                      {!isEditingProfile && (
                        <button 
                          onClick={() => {
                            setEditedName(profile.name);
                            setEditedEmail(profile.email);
                            setIsEditingProfile(true);
                          }}
                          className="text-luxury-gray hover:text-[#1C1C1C] transition-colors p-1"
                          id="btn-edit-profile"
                          title="Edit profile attributes"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <AnimatePresence mode="wait">
                      {!isEditingProfile ? (
                        <motion.div 
                          key="static-prof"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-4"
                        >
                          <div>
                            <p className="font-mono text-[9px] text-luxury-gray uppercase tracking-widest leading-none mb-1.5">Registered Name</p>
                            <p className="text-sm font-semibold text-[#1C1C1C]">{profile.name}</p>
                          </div>
                          <div>
                            <p className="font-mono text-[9px] text-luxury-gray uppercase tracking-widest leading-none mb-1.5">Email Destination</p>
                            <p className="text-sm font-semibold text-[#1C1C1C]">{profile.email}</p>
                          </div>
                          <div>
                            <p className="font-mono text-[9px] text-luxury-gray uppercase tracking-widest leading-none mb-1.5">Member Status</p>
                            <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 inline-block px-2.5 py-1 rounded border border-emerald-100">
                              Active Since {profile.memberSince}
                            </p>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.form 
                          key="form-prof"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onSubmit={handleSaveProfile}
                          className="space-y-4"
                        >
                          <div>
                            <label htmlFor="edit-name" className="block font-mono text-[9px] text-luxury-gray uppercase tracking-widest mb-1">Name</label>
                            <input
                              id="edit-name"
                              type="text"
                              value={editedName}
                              required
                              onChange={(e) => setEditedName(e.target.value)}
                              className="w-full bg-[#FAF9F6] border border-luxury-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1C1C1C]"
                            />
                          </div>
                          <div>
                            <label htmlFor="edit-email" className="block font-mono text-[9px] text-luxury-gray uppercase tracking-widest mb-1">Email</label>
                            <input
                              id="edit-email"
                              type="email"
                              value={editedEmail}
                              required
                              onChange={(e) => setEditedEmail(e.target.value)}
                              className="w-full bg-[#FAF9F6] border border-luxury-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1C1C1C]"
                            />
                          </div>
                          <div className="flex gap-2 pt-2">
                            <button
                              id="btn-save-profile"
                              type="submit"
                              className="px-3.5 py-2 bg-[#1C1C1C] text-white text-[11px] font-bold uppercase rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1"
                            >
                              <Save className="h-3 w-3" />
                              Save Changes
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingProfile(false)}
                              className="px-3.5 py-2 border border-luxury-border text-[11px] font-bold uppercase rounded-lg hover:bg-neutral-50 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Card 2: Quick order overview shortcuts list */}
                  <div className="bg-white rounded-2xl border border-luxury-border p-6 md:p-8 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-light-gray pb-4 mb-5">
                        <h3 className="font-serif text-lg font-medium text-[#1C1C1C] flex items-center gap-2">
                          <Package className="h-4 w-4 text-luxury-gray" />
                          Recent Handled Orders
                        </h3>
                        <button 
                          onClick={() => setActiveTab('orders')}
                          className="font-mono text-[9px] hover:underline uppercase tracking-wide text-luxury-gray hover:text-[#1C1C1C]"
                          id="link-view-all-orders-card"
                        >
                          View All
                        </button>
                      </div>

                      <div className="space-y-4">
                        {orders.map((o) => (
                          <div 
                            key={o.id} 
                            onClick={() => { setSelectedInspectOrder(o); setActiveTab('orders'); }}
                            className="flex gap-4 items-center p-3 bg-[#FAF9F6] border border-luxury-border/50 rounded-xl hover:border-luxury-gray transition-colors cursor-pointer group"
                          >
                            <img 
                              src={o.item.image} 
                              alt={o.item.title} 
                              referrerPolicy="no-referrer"
                              className="w-10 h-12 object-cover object-top rounded-lg border border-gray-100 flex-shrink-0"
                            />
                            <div className="flex-grow text-left leading-tight">
                              <span className="font-mono text-[9px] text-luxury-gray uppercase leading-none block mb-1">
                                {o.id} • {o.date}
                              </span>
                              <p className="text-xs font-semibold text-[#1C1C1C] group-hover:underline">{o.item.title}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-mono font-bold text-[#1C1C1C] block">{formatINR(o.total)}</span>
                              <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-100 uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ml-auto">
                                {o.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Sub section: Curated Wishlist Showcase */}
                <div className="bg-white rounded-2xl border border-luxury-border p-6 md:p-8 shadow-xs">
                  <div className="flex justify-between items-center border-b border-luxury-border/60 pb-4 mb-6">
                    <div>
                      <h3 className="font-serif text-lg font-medium text-[#1C1C1C]">
                        Curated Archival Wishlist
                      </h3>
                      <p className="text-xs text-luxury-gray mt-1 leading-none font-light">Authentic handpicked selections set aside for your catalog rotation.</p>
                    </div>
                    
                    <button 
                      onClick={() => setView('shop')}
                      className="font-mono text-[9px] uppercase hover:underline tracking-wider font-semibold text-luxury-gray/95 hover:text-[#1C1C1C]"
                      id="wishlist-btn-catalog"
                    >
                      Browse Boutique
                    </button>
                  </div>

                  {/* Curated grid matching layout */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {activeWishlist.map((prod) => (
                      <div 
                        key={prod.id} 
                        className="group relative cursor-pointer flex flex-col justify-between"
                      >
                        {/* Image canvas with actions */}
                        <div className="aspect-[3/4] bg-[#FAF9F6] border border-neutral-100 rounded-xl overflow-hidden mb-3 relative group">
                          <img
                            alt={prod.title}
                            src={prod.image}
                            onClick={() => handleProductClick(prod)}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          
                          {/* Quick add prompt layer */}
                          <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleQuickAdd(prod); }}
                              className="w-full bg-[#1C1C1C]/90 backdrop-blur-xs text-white py-2 px-1 rounded-lg font-sans text-[10px] uppercase font-bold tracking-wider hover:bg-[#1C1C1C] transition-all"
                              id={`quick-add-${prod.id}`}
                            >
                              Quick Add
                            </button>
                          </div>

                          {/* Heart toggle clicker */}
                          <button
                            onClick={(e) => { e.stopPropagation(); onToggleWishlist(prod); }}
                            className="absolute top-3 right-3 p-1.5 bg-white rounded-full text-red-500 shadow-xs hover:scale-105 active:scale-95 transition-transform"
                            id={`heart-toggle-${prod.id}`}
                            title="Remove from wishlist"
                          >
                            <Heart className="h-3.5 w-3.5 fill-current" />
                          </button>
                        </div>

                        {/* Title and pricing info */}
                        <div className="text-left pt-1" onClick={() => handleProductClick(prod)}>
                          <span className="font-mono text-[8.5px] uppercase tracking-widest text-[#1c1c1c]/50 block">
                            {prod.brand}
                          </span>
                          <h4 className="text-xs font-semibold text-[#1C1C1C] truncate leading-tight group-hover:underline mt-0.5">
                            {prod.title}
                          </h4>
                          <span className="font-mono text-xs font-bold text-[#1C1C1C] block mt-1">
                            {formatINR(prod.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

              </div>
            )}

            {/* ANCHOR: Tab - Order History (Includes full detailed view/inspector) */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl border border-luxury-border p-6 md:p-8 shadow-xs">
                
                <AnimatePresence mode="wait">
                  {!selectedInspectOrder ? (
                    <motion.div 
                      key="order-list-tab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className="font-serif text-xl font-medium text-[#1C1C1C]">
                          Historical Purchase Ledger
                        </h3>
                        <p className="text-xs text-luxury-gray mt-1 leading-none font-light">Each archived garment undergoes meticulous physical inspection and carbon audit dispatch verification.</p>
                      </div>

                      <div className="space-y-4">
                        {orders.map((o) => (
                          <div 
                            key={o.id}
                            onClick={() => setSelectedInspectOrder(o)}
                            className="p-5 border border-luxury-border rounded-xl bg-[#FAF9F6] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-luxury-gray cursor-pointer transition-all hover:shadow-xs group"
                          >
                            <div className="flex gap-4 items-center">
                              <img 
                                src={o.item.image} 
                                alt={o.item.title} 
                                referrerPolicy="no-referrer"
                                className="w-12 h-16 object-cover object-top rounded-lg border border-gray-200"
                              />
                              <div className="text-left">
                                <span className="font-mono text-[9px] uppercase tracking-wider text-luxury-gray font-bold">
                                  ORDER {o.id}
                                </span>
                                <h4 className="text-sm font-semibold text-[#1C1C1C] group-hover:underline">{o.item.title}</h4>
                                <p className="text-xs text-luxury-gray font-mono mt-0.5">Dispatched on {o.date}</p>
                              </div>
                            </div>

                            <div className="flex md:flex-col justify-between w-full md:w-auto items-center md:items-end border-t md:border-t-0 pt-3 md:pt-0 border-luxury-border/50">
                              <span className="text-sm font-mono font-bold text-[#1C1C1C]">{formatINR(o.total)}</span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-700 animate-pulse"></span>
                                <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-100 uppercase tracking-widest px-2 py-0.5 rounded font-bold">
                                  {o.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                    </motion.div>
                  ) : (
                    
                    /* Detailed order inspector matching mockup */
                    <motion.div 
                      key="order-inspector-tab"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <button 
                        onClick={() => setSelectedInspectOrder(null)}
                        className="text-xs text-luxury-gray hover:text-[#1C1C1C] transition-colors flex items-center gap-1 uppercase tracking-wider font-mono font-bold"
                        id="btn-back-to-orders-list"
                      >
                        ← Back to Ledger
                      </button>

                      <div className="border-b border-luxury-border pb-4 flex flex-col md:flex-row md:justify-between md:items-end gap-3">
                        <div className="text-left">
                          <span className="font-mono text-xs text-luxury-gray uppercase">CERTIFIED SECURE ARCHIVE</span>
                          <h2 className="font-serif text-2xl font-bold tracking-wide text-[#1C1C1C]">
                            Order ID: {selectedInspectOrder.id}
                          </h2>
                          <p className="text-xs text-luxury-gray mt-1">Acquired and closed on {selectedInspectOrder.date}</p>
                        </div>
                        
                        <div className="text-left md:text-right font-mono text-xs text-[#1C1C1C]">
                          <span className="text-luxury-gray block">Eco-Logistics ID:</span>
                          <span className="font-bold">{selectedInspectOrder.tracking}</span>
                        </div>
                      </div>

                      {/* Item and shipping details panel split */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        <div className="md:col-span-2 bg-[#FAF9F6] border border-luxury-border rounded-xl p-5 space-y-4">
                          <span className="font-mono text-[9px] uppercase tracking-widest text-[#1c1c1c]/50 font-bold block">GARMENT SPECS</span>
                          <div className="flex gap-4">
                            <img 
                              src={selectedInspectOrder.item.image} 
                              alt={selectedInspectOrder.item.title} 
                              referrerPolicy="no-referrer"
                              className="w-20 h-24 object-cover object-top rounded-xl border border-neutral-100 flex-shrink-0"
                            />
                            <div className="text-left leading-relaxed">
                              <span className="font-mono text-[10px] uppercase text-luxury-gray">{selectedInspectOrder.item.brand}</span>
                              <h3 className="text-base font-semibold text-luxury-charcoal">{selectedInspectOrder.item.title}</h3>
                              <p className="text-xs text-luxury-gray mt-1">{selectedInspectOrder.item.details}</p>
                              <div className="mt-4 flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-[#1C1C1C] bg-white border border-luxury-border px-3 py-1.5 rounded-lg">
                                  Captured Total: {formatINR(selectedInspectOrder.total)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Shipment timeline */}
                        <div className="bg-white border border-luxury-border rounded-xl p-5 space-y-4 leading-relaxed text-xs flex flex-col justify-between">
                          <div>
                            <span className="font-mono text-[9px] uppercase tracking-widest text-luxury-gray font-bold block mb-3">LOGISTIC DISPATCH</span>
                            
                            <div className="space-y-4 relative pl-3 border-l border-neutral-200">
                              <div className="relative">
                                <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-emerald-700"></span>
                                <p className="font-bold text-[#1C1C1C]">Delivered Successfully</p>
                                <p className="text-[10px] text-luxury-gray">{selectedInspectOrder.date}</p>
                              </div>
                              <div className="relative">
                                <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-neutral-300"></span>
                                <p className="font-medium text-luxury-gray">Eco Carbon Offset Cleared</p>
                                <p className="text-[10px] text-neutral-400">September 29</p>
                              </div>
                              <div className="relative">
                                <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-neutral-300"></span>
                                <p className="font-medium text-luxury-gray">Workshop Authen Grade</p>
                                <p className="text-[10px] text-neutral-400">September 28</p>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setView('tracking')}
                            className="w-full mt-4 bg-[#1C1C1C] hover:bg-neutral-800 text-white font-semibold text-[10px] tracking-widest py-3 rounded-xl uppercase flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Truck className="h-4.5 w-4.5" /> Live Order Tracking
                          </button>
                        </div>

                      </div>

                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            )}

            {/* ANCHOR: Tab - Addresses */}
            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl border border-luxury-border p-6 md:p-8 shadow-xs space-y-6">
                
                <div className="flex justify-between items-center border-b border-light-gray pb-4">
                  <div className="text-left">
                    <h3 className="font-serif text-xl font-medium text-[#1C1C1C]">
                      Saved Shipping Hubs
                    </h3>
                    <p className="text-xs text-luxury-gray mt-1 leading-none font-light">Set default destinations to experience near-instant editorial checkout.</p>
                  </div>

                  <button
                    onClick={() => { setShowAddAddress(!showAddAddress); }}
                    className="flex items-center gap-1 px-3 py-1.5 border border-luxury-border rounded-xl text-xs font-bold uppercase hover:bg-neutral-50 transition-all font-mono"
                    id="btn-trigger-add-address"
                  >
                    {showAddAddress ? 'Close Panel' : 'Add Register'}
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Add address collapse form */}
                <AnimatePresence>
                  {showAddAddress && (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleAddNewAddress}
                      className="overflow-hidden bg-[#FAF9F6] border border-luxury-border rounded-xl p-5 space-y-4 text-left"
                    >
                      <h4 className="font-serif text-xs uppercase font-bold tracking-wider text-luxury-charcoal">New Dispatch Address Register</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="addr-label" className="block text-[10px] font-bold text-luxury-gray uppercase mb-1">Nickname (e.g. Home, Berlin Lab)</label>
                          <input
                            id="addr-label"
                            type="text"
                            required
                            placeholder="Home"
                            value={newAddress.label}
                            onChange={(e) => setNewAddress({...newAddress, label: e.target.value})}
                            className="w-full bg-white border border-luxury-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1C1C1C]"
                          />
                        </div>
                        <div>
                          <label htmlFor="addr-name" className="block text-[10px] font-bold text-luxury-gray uppercase mb-1">Full Addressee Name</label>
                          <input
                            id="addr-name"
                            type="text"
                            required
                            placeholder="Eleanor Vance"
                            value={newAddress.fullName}
                            onChange={(e) => setNewAddress({...newAddress, fullName: e.target.value})}
                            className="w-full bg-white border border-luxury-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1C1C1C]"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label htmlFor="addr-street" className="block text-[10px] font-bold text-luxury-gray uppercase mb-1">Street and Number</label>
                          <input
                            id="addr-street"
                            type="text"
                            required
                            placeholder="452 Lafayette Street"
                            value={newAddress.street}
                            onChange={(e) => setNewAddress({...newAddress, street: e.target.value})}
                            className="w-full bg-white border border-luxury-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1C1C1C]"
                          />
                        </div>
                        <div>
                          <label htmlFor="addr-city" className="block text-[10px] font-bold text-luxury-gray uppercase mb-1">City</label>
                          <input
                            id="addr-city"
                            type="text"
                            required
                            placeholder="New York"
                            value={newAddress.city}
                            onChange={(e) => setNewAddress({...newAddress, city: e.target.value})}
                            className="w-full bg-white border border-luxury-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1C1C1C]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="addr-state" className="block text-[10px] font-bold text-luxury-gray uppercase mb-1">State / Prov</label>
                            <input
                              id="addr-state"
                              type="text"
                              required
                              placeholder="NY"
                              value={newAddress.state}
                              onChange={(e) => setNewAddress({...newAddress, state: e.target.value})}
                              className="w-full bg-white border border-luxury-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1C1C1C]"
                            />
                          </div>
                          <div>
                            <label htmlFor="addr-zip" className="block text-[10px] font-bold text-luxury-gray uppercase mb-1">ZIP / Postal</label>
                            <input
                              id="addr-zip"
                              type="text"
                              required
                              placeholder="10003"
                              value={newAddress.zip}
                              onChange={(e) => setNewAddress({...newAddress, zip: e.target.value})}
                              className="w-full bg-white border border-luxury-border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#1C1C1C]"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        id="btn-submit-new-address"
                        className="px-4 py-2 bg-[#1C1C1C] text-white text-xs font-bold uppercase rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        Register Address
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Display register cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {addresses.map((addr) => (
                    <div 
                      key={addr.id}
                      className={`p-5 rounded-2xl border text-left flex flex-col justify-between space-y-4 transition-all ${
                        addr.isDefault 
                          ? 'border-[#1C1C1C] bg-[#FAF9F6]/30 shadow-xs' 
                          : 'border-luxury-border bg-white hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-semibold text-xs text-luxury-charcoal uppercase block font-mono tracking-widest">{addr.label}</span>
                          <span className="text-xs text-luxury-gray block mt-1">{addr.fullName}</span>
                        </div>

                        {addr.isDefault && (
                          <span className="text-[9px] font-bold font-mono tracking-wider background-[#1C1C1C] text-[#1C1C1C] border border-[#1C1C1C] uppercase px-2 py-0.5 rounded">
                            DEFAULT
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-luxury-gray leading-normal italic">
                        <p>{addr.street}</p>
                        <p>{addr.city}, {addr.state} {addr.zip}</p>
                        <p>{addr.country}</p>
                      </div>

                      <div className="flex gap-4 pt-2 border-t border-luxury-border/50 text-[11px] font-bold uppercase font-mono tracking-wider">
                        {!addr.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-[#1C1C1C] hover:underline"
                            id={`addr-set-default-${addr.id}`}
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-red-700 hover:underline flex items-center gap-1 ml-auto"
                          id={`addr-delete-${addr.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* ANCHOR: Tab - Settings */}
            {activeTab === 'settings' && (
              <div className="bg-white rounded-2xl border border-luxury-border p-6 md:p-8 shadow-xs space-y-8">
                
                <div className="border-b border-light-gray pb-4 text-left">
                  <h3 className="font-serif text-xl font-medium text-[#1C1C1C]">
                    Communication & Workshop Parameters
                  </h3>
                  <p className="text-xs text-luxury-gray mt-1 leading-none font-light">Tune notification logs, telemetry indicators, and luxury packaging selections.</p>
                </div>

                {/* Preference 1 */}
                <div className="space-y-4 text-left">
                  <span className="font-mono text-[9px] text-luxury-gray uppercase tracking-widest font-bold">Release Alerts</span>
                  <p className="text-xs text-luxury-gray">How soon should we notify you of high-fidelity archival drops that match your wishlist metrics?</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['immediate', 'daily-digest', 'disabled'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAlertPreference(p)}
                        className={`p-3.5 border rounded-xl text-xs font-semibold text-left transition-all ${
                          alertPreference === p 
                            ? 'border-[#1C1C1C] bg-[#FAF9F6] text-[#1C1C1C]' 
                            : 'border-luxury-border text-luxury-gray hover:border-neutral-400 bg-white'
                        }`}
                      >
                        <span className="capitalize block">{p.replace('-', ' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preference 2 */}
                <div className="space-y-4 text-left pt-2">
                  <span className="font-mono text-[9px] text-luxury-gray uppercase tracking-widest font-bold">Signature Packaging Experience</span>
                  <p className="text-xs text-luxury-gray">Every shipment features reusable organic materials. Tune your visual aesthetic unpacking standard.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPackagingPreference('eco-pouch')}
                      className={`p-4 border rounded-xl text-xs text-left transition-all flex justify-between items-center ${
                        packagingPreference === 'eco-pouch' 
                          ? 'border-[#1C1C1C] bg-[#FAF9F6]' 
                          : 'border-luxury-border bg-white'
                      }`}
                    >
                      <div className="text-left leading-normal">
                        <strong className="block text-luxury-charcoal uppercase tracking-wide">Minimalist Organic Garment Sleeve</strong>
                        <span className="text-luxury-gray text-[11px] block mt-1">Scented with organic lavender, packed inside modular cardboard envelopes.</span>
                      </div>
                      {packagingPreference === 'eco-pouch' && <Check className="h-4 w-4 text-[#1C1C1C] shrink-0 ml-2" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPackagingPreference('archive-box')}
                      className={`p-4 border rounded-xl text-xs text-left transition-all flex justify-between items-center ${
                        packagingPreference === 'archive-box' 
                          ? 'border-[#1C1C1C] bg-[#FAF9F6]' 
                          : 'border-luxury-border bg-white'
                      }`}
                    >
                      <div className="text-left leading-normal">
                        <strong className="block text-luxury-charcoal uppercase tracking-wide">The Collector's Archive Board Box</strong>
                        <span className="text-luxury-gray text-[11px] block mt-1">Rigid reusable display casing suitable for long-term wardrobe protection.</span>
                      </div>
                      {packagingPreference === 'archive-box' && <Check className="h-4 w-4 text-[#1C1C1C] shrink-0 ml-2" />}
                    </button>
                  </div>
                </div>

                <div className="border-t border-luxury-border/60 pt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => alert("Settings successfully committed to decentralized session storage.")}
                    className="px-5 py-3 bg-[#1C1C1C] text-white text-xs font-bold uppercase rounded-full hover:bg-neutral-800 transition-all tracking-wider font-sans shadow-md"
                    id="btn-save-settings"
                  >
                    Commit Settings
                  </button>
                </div>

              </div>
            )}

          </main>

        </div>
      </div>

    </div>
  );
}
