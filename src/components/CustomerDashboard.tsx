import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n/index.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { Order, Product, SupportedLanguage, SUPPORTED_LANGUAGES } from '../types/index.ts';
import {
  User as UserIcon,
  Package,
  Heart,
  Globe,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ShoppingBag,
  ChevronRight,
  ShieldCheck,
  Save,
  X,
} from 'lucide-react';

export const CustomerDashboard: React.FC<{ onNavigateHome: () => void }> = ({ onNavigateHome }) => {
  const { t, language, setLanguage, formatPrice, translateField } = useI18n();
  const { user, token, updateLanguage, updateProfile, logout } = useAuth();
  const { addToCart } = useCart();
  const { wishlistIds } = useWishlist();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'wishlist' | 'language'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Profile Form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [deliveryAddress, setDeliveryAddress] = useState(user?.deliveryAddress || '');
  const [county, setCounty] = useState(user?.county || 'Nairobi');
  const [town, setTown] = useState(user?.town || 'Nairobi');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Fetch orders
  useEffect(() => {
    if (!token) return;
    async function fetchOrders() {
      setLoading(true);
      try {
        const res = await fetch('/api/orders/user', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error('Failed to load user orders:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [token]);

  // Fetch wishlist products
  useEffect(() => {
    if (!token) return;
    async function fetchWishlist() {
      try {
        const res = await fetch('/api/wishlist', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const prods = await res.json();
          setWishlistProducts(prods);
        }
      } catch (err) {
        console.error('Failed to load wishlist:', err);
      }
    }
    fetchWishlist();
  }, [token, wishlistIds]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    const ok = await updateProfile({
      fullName,
      phone,
      deliveryAddress,
      county,
      town,
    });
    if (ok) {
      setProfileSuccessMsg(t.dashboard.profileUpdated);
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    }
  };

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
    updateLanguage(lang);
  };

  const getOrderStatusBadge = (status: Order['orderStatus']) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.orders.statusPaid}
          </span>
        );
      case 'processing':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {t.orders.statusProcessing}
          </span>
        );
      case 'shipped':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" />
            {t.orders.statusShipped}
          </span>
        );
      case 'delivered':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.orders.statusDelivered}
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {t.orders.statusCancelled}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-theme-elevated text-theme-text border border-theme-border">
            {t.orders.statusPending}
          </span>
        );
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-theme-text">
        <h2 className="text-xl font-bold mb-2">Please Sign In</h2>
        <p className="text-theme-muted mb-6">You need an active account session to view your customer dashboard.</p>
        <button
          onClick={onNavigateHome}
          className="px-6 py-2.5 rounded-full bg-theme-accent text-theme-accent-text font-bold text-sm border-2 border-theme-border"
        >
          {t.common.back} {t.nav.home}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-theme-text">
      {/* Header Banner */}
      <div className="bg-theme-elevated text-theme-text p-6 sm:p-8 rounded-3xl border-2 border-theme-border shadow-lg mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-theme-accent">
            {t.dashboard.profile}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-theme-text">
            {t.dashboard.welcome.replace('{name}', user.fullName)}
          </h1>
          <p className="text-xs sm:text-sm text-theme-muted mt-1">
            {user.email} • {user.phone}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              logout();
              onNavigateHome();
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-theme-surface hover:bg-theme-elevated text-theme-text transition border-2 border-theme-border cursor-pointer"
          >
            {t.nav.logout}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="space-y-1 bg-theme-surface p-3 rounded-2xl border-2 border-theme-border shadow-xs h-fit">
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer border-2 ${
              activeTab === 'orders'
                ? 'bg-theme-accent text-theme-accent-text border-theme-border font-bold'
                : 'text-theme-text border-transparent hover:bg-theme-elevated'
            }`}
          >
            <div className="flex items-center gap-3">
              <Package className="w-4 h-4" />
              <span>{t.dashboard.myOrders}</span>
            </div>
            <span className="text-xs bg-theme-elevated text-theme-text px-2 py-0.5 rounded-full border border-theme-border">
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer border-2 ${
              activeTab === 'profile'
                ? 'bg-theme-accent text-theme-accent-text border-theme-border font-bold'
                : 'text-theme-text border-transparent hover:bg-theme-elevated'
            }`}
          >
            <div className="flex items-center gap-3">
              <UserIcon className="w-4 h-4" />
              <span>{t.dashboard.profile}</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer border-2 ${
              activeTab === 'wishlist'
                ? 'bg-theme-accent text-theme-accent-text border-theme-border font-bold'
                : 'text-theme-text border-transparent hover:bg-theme-elevated'
            }`}
          >
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>{t.dashboard.myWishlist}</span>
            </div>
            <span className="text-xs bg-theme-elevated text-theme-text px-2 py-0.5 rounded-full border border-theme-border">
              {wishlistProducts.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('language')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer border-2 ${
              activeTab === 'language'
                ? 'bg-theme-accent text-theme-accent-text border-theme-border font-bold'
                : 'text-theme-text border-transparent hover:bg-theme-elevated'
            }`}
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4" />
              <span>{t.dashboard.languagePref}</span>
            </div>
            <span className="text-sm">
              {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.flag}
            </span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="lg:col-span-3">
          {/* 1. ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="bg-theme-surface p-6 rounded-3xl border-2 border-theme-border shadow-xs text-theme-text">
                <h2 className="text-lg font-bold text-theme-text mb-1">{t.orders.title}</h2>
                <p className="text-xs text-theme-muted mb-6">{t.orders.subtitle}</p>

                {orders.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Package className="w-12 h-12 text-theme-muted mx-auto" />
                    <p className="text-theme-muted font-medium text-sm">{t.orders.noOrders}</p>
                    <button
                      onClick={onNavigateHome}
                      className="px-5 py-2 bg-theme-accent hover:opacity-90 text-theme-accent-text rounded-full text-xs font-bold transition border-2 border-theme-border"
                    >
                      {t.cart.startShopping}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-4 sm:p-5 rounded-2xl border-2 border-theme-border bg-theme-elevated space-y-3 text-theme-text"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-theme-border pb-3">
                          <div>
                            <span className="text-xs text-theme-muted uppercase font-semibold">
                              {t.orders.orderNumber}
                            </span>
                            <div className="text-sm sm:text-base font-extrabold text-theme-text font-mono">
                              {ord.orderNumber}
                            </div>
                            <div className="text-xs text-theme-muted">
                              {new Date(ord.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {getOrderStatusBadge(ord.orderStatus)}
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              className="px-3 py-1.5 bg-theme-surface border-2 border-theme-border hover:bg-theme-elevated text-xs font-bold text-theme-text rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <span>{t.orders.viewDetails}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Summary details */}
                        <div className="flex flex-wrap items-center justify-between text-xs text-theme-muted gap-2">
                          <div>
                            <span className="font-semibold text-theme-text">
                              {ord.items.length} {t.common.items}
                            </span>
                            <span className="mx-2">•</span>
                            <span>Destination: {ord.town}, {ord.county}</span>
                          </div>

                          {ord.mpesaReceiptNumber && (
                            <div className="flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-300">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>M-Pesa: {ord.mpesaReceiptNumber}</span>
                            </div>
                          )}

                          <div className="text-sm font-extrabold text-theme-text">
                            {formatPrice(ord.totalAmount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="bg-theme-surface p-6 sm:p-8 rounded-3xl border-2 border-theme-border shadow-xs text-theme-text">
              <h2 className="text-lg font-bold text-theme-text mb-1">{t.dashboard.profile}</h2>
              <p className="text-xs text-theme-muted mb-6">Manage your contact and delivery address information.</p>

              {profileSuccessMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-bold text-theme-text mb-1">
                    {t.auth.fullName}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-theme-surface border-2 border-theme-border rounded-xl text-sm text-theme-text font-semibold placeholder:text-theme-muted focus:outline-hidden focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-text mb-1">
                    {t.auth.phone} (M-Pesa)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-theme-surface border-2 border-theme-border rounded-xl text-sm text-theme-text font-semibold placeholder:text-theme-muted focus:outline-hidden focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-theme-text mb-1">
                      {t.checkout.county}
                    </label>
                    <input
                      type="text"
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-theme-surface border-2 border-theme-border rounded-xl text-sm text-theme-text font-semibold placeholder:text-theme-muted focus:outline-hidden focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-theme-text mb-1">
                      {t.checkout.town}
                    </label>
                    <input
                      type="text"
                      value={town}
                      onChange={(e) => setTown(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-theme-surface border-2 border-theme-border rounded-xl text-sm text-theme-text font-semibold placeholder:text-theme-muted focus:outline-hidden focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-text mb-1">
                    {t.checkout.deliveryAddress}
                  </label>
                  <input
                    type="text"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. Kimathi House, 3rd Floor"
                    className="w-full px-3.5 py-2.5 bg-theme-surface border-2 border-theme-border rounded-xl text-sm text-theme-text font-semibold placeholder:text-theme-muted focus:outline-hidden focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-theme-accent hover:opacity-90 text-theme-accent-text rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs border-2 border-theme-border"
                >
                  <Save className="w-4 h-4" />
                  <span>{t.dashboard.updateProfile}</span>
                </button>
              </form>
            </div>
          )}

          {/* 3. WISHLIST TAB */}
          {activeTab === 'wishlist' && (
            <div className="bg-theme-surface p-6 sm:p-8 rounded-3xl border-2 border-theme-border shadow-xs text-theme-text">
              <h2 className="text-lg font-bold text-theme-text mb-1">{t.dashboard.myWishlist}</h2>
              <p className="text-xs text-theme-muted mb-6">Your saved favorite Kenyan goods.</p>

              {wishlistProducts.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Heart className="w-12 h-12 text-theme-muted mx-auto" />
                  <p className="text-theme-muted text-sm">No items in your wishlist yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3.5 rounded-2xl border-2 border-theme-border flex items-center gap-3 bg-theme-elevated"
                    >
                      <img
                        src={prod.images[0]}
                        alt={translateField(prod.name)}
                        className="w-16 h-16 rounded-xl object-cover border-2 border-theme-border shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-theme-text truncate">
                          {translateField(prod.name)}
                        </h4>
                        <div className="text-xs font-extrabold text-theme-accent mt-1">
                          {formatPrice(prod.discountPrice || prod.price)}
                        </div>
                        <button
                          onClick={() => addToCart(prod, 'product', 1)}
                          className="mt-2 text-[11px] font-bold text-theme-accent hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>{t.products.addToCart}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. LANGUAGE PREFERENCE TAB */}
          {activeTab === 'language' && (
            <div className="bg-theme-surface p-6 sm:p-8 rounded-3xl border-2 border-theme-border shadow-xs text-theme-text">
              <h2 className="text-lg font-bold text-theme-text mb-1">{t.dashboard.languagePref}</h2>
              <p className="text-xs text-theme-muted mb-6">
                Choose your preferred interface language. This is saved to your account and activates automatically across all devices.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = lang.code === language;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`p-4 rounded-2xl border-2 text-left transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-theme-accent bg-theme-elevated ring-2 ring-theme-accent/20'
                          : 'border-theme-border bg-theme-surface hover:bg-theme-elevated'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{lang.flag}</span>
                        <div>
                          <div className="font-bold text-sm text-theme-text">{lang.nativeName}</div>
                          <div className="text-xs text-theme-muted">{lang.name}</div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-theme-accent" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-theme-surface rounded-3xl max-w-lg w-full p-6 shadow-2xl border-2 border-theme-border space-y-4 max-h-[85vh] overflow-y-auto animate-in zoom-in-95 text-theme-text">
            <div className="flex items-center justify-between border-b-2 border-theme-border pb-3">
              <div>
                <span className="text-xs text-theme-muted uppercase font-semibold">
                  Order Details
                </span>
                <h3 className="text-base font-extrabold text-theme-text font-mono">
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full text-theme-muted hover:text-theme-text hover:bg-theme-elevated transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Status & Receipt */}
            <div className="p-3.5 rounded-2xl bg-theme-elevated border-2 border-theme-border space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-theme-muted">{t.orders.orderStatus}</span>
                {getOrderStatusBadge(selectedOrder.orderStatus)}
              </div>
              {selectedOrder.mpesaReceiptNumber && (
                <div className="flex justify-between items-center pt-2 border-t-2 border-theme-border">
                  <span className="text-theme-muted">{t.mpesa.receiptNumber}</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {selectedOrder.mpesaReceiptNumber}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t-2 border-theme-border">
                <span className="text-theme-muted">{t.orders.deliveryDetails}</span>
                <span className="font-medium text-theme-text text-right">
                  {selectedOrder.deliveryAddress}, {selectedOrder.town}, {selectedOrder.county}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="divide-y-2 divide-theme-border">
              {selectedOrder.items.map((it) => (
                <div key={it.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-theme-text">{it.name}</div>
                    <div className="text-theme-muted">Qty: {it.quantity} × {formatPrice(it.unitPrice)}</div>
                  </div>
                  <div className="font-bold text-theme-text">{formatPrice(it.totalPrice)}</div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="pt-3 border-t-2 border-theme-border flex justify-between items-center text-sm font-extrabold text-theme-text">
              <span>{t.cart.total}</span>
              <span className="text-theme-accent text-base">{formatPrice(selectedOrder.totalAmount)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
