import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n/index.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { Product, Service, Order, PaymentTransaction, SupportedLanguage, SUPPORTED_LANGUAGES } from '../types/index.ts';
import {
  ShieldCheck,
  TrendingUp,
  Package,
  Calendar,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  Plus,
  Trash2,
  Edit,
  Clock,
  CheckCircle2,
  Globe,
  Settings,
  X,
  Search,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const AdminDashboard: React.FC<{ onNavigateHome: () => void }> = ({ onNavigateHome }) => {
  const { t, formatPrice, translateField } = useI18n();
  const { user, token } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'services' | 'payments' | 'translations' | 'mpesa'>('overview');

  // Stats
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [mpesaConfig, setMpesaConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // New Product Form state with 6 language inputs
  const [prodNames, setProdNames] = useState<Record<SupportedLanguage, string>>({
    en: '',
    sw: '',
    lg: '',
    zh: '',
    es: '',
    pt: '',
  });
  const [prodDescs, setProdDescs] = useState<Record<SupportedLanguage, string>>({
    en: '',
    sw: '',
    lg: '',
    zh: '',
    es: '',
    pt: '',
  });
  const [prodPrice, setProdPrice] = useState('');
  const [prodDiscountPrice, setProdDiscountPrice] = useState('');
  const [prodStock, setProdStock] = useState('20');
  const [prodOrigin, setProdOrigin] = useState('Nairobi, Kenya');
  const [prodCategory, setProdCategory] = useState('cat_coffee');
  const [prodImage, setProdImage] = useState('');

  // Fetch all admin data
  const loadAdminData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, ordersRes, productsRes, servicesRes, paymentsRes, mpesaRes] =
        await Promise.all([
          fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/products'),
          fetch('/api/services'),
          fetch('/api/admin/payments', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/mpesa/config'),
        ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (productsRes.ok) setProducts(await productsRes.json());
      if (servicesRes.ok) setServices(await servicesRes.json());
      if (paymentsRes.ok) setPayments(await paymentsRes.json());
      if (mpesaRes.ok) setMpesaConfig(await mpesaRes.json());
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [token]);

  const handleUpdateOrderStatus = async (
    orderId: string,
    orderStatus: Order['orderStatus'],
    paymentStatus?: Order['paymentStatus']
  ) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderStatus, paymentStatus }),
      });
      if (res.ok) {
        loadAdminData();
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const payload = {
      name: prodNames,
      description: prodDescs,
      price: Number(prodPrice),
      discountPrice: prodDiscountPrice ? Number(prodDiscountPrice) : undefined,
      stockQuantity: Number(prodStock),
      origin: prodOrigin,
      categoryId: prodCategory,
      images: prodImage ? [prodImage] : ['https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=800&q=80'],
    };

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setProductModalOpen(false);
        setEditingProduct(null);
        resetProductForm();
        loadAdminData();
      }
    } catch (err) {
      console.error('Failed to save product:', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm(t.admin.deleteConfirm)) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        loadAdminData();
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  const resetProductForm = () => {
    setProdNames({ en: '', sw: '', lg: '', zh: '', es: '', pt: '' });
    setProdDescs({ en: '', sw: '', lg: '', zh: '', es: '', pt: '' });
    setProdPrice('');
    setProdDiscountPrice('');
    setProdStock('20');
    setProdOrigin('Nairobi, Kenya');
    setProdCategory('cat_coffee');
    setProdImage('');
  };

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdNames(prod.name);
    setProdDescs(prod.description);
    setProdPrice(prod.price.toString());
    setProdDiscountPrice(prod.discountPrice ? prod.discountPrice.toString() : '');
    setProdStock(prod.stockQuantity.toString());
    setProdOrigin(prod.origin);
    setProdCategory(prod.categoryId);
    setProdImage(prod.images[0] || '');
    setProductModalOpen(true);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-theme-text">Administrative Access Required</h2>
        <p className="text-theme-muted text-sm max-w-md mx-auto">
          You must be signed in with an administrator account to view the merchant backoffice.
        </p>
        <div className="p-4 rounded-2xl bg-theme-elevated border-2 border-theme-border text-xs text-theme-text max-w-sm mx-auto text-center font-medium">
          Administrator accounts are provisioned securely via environment variables (<code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code>).
        </div>
        <button
          onClick={onNavigateHome}
          className="px-6 py-2.5 rounded-full bg-theme-accent hover:opacity-90 text-theme-accent-text font-bold text-xs border-2 border-theme-border cursor-pointer transition shadow-xs"
        >
          {t.common.back} {t.nav.home}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Admin Header */}
      <div className="bg-theme-elevated text-theme-text p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-2 border-theme-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
              Merchant Management
            </span>
            <span className="text-xs text-stone-400 font-mono">
              Daraja: {mpesaConfig?.environment || 'sandbox'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            {t.admin.portalTitle}
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Logged in as {user.fullName} ({user.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAdminData}
            className="p-2.5 rounded-xl bg-theme-surface hover:bg-theme-elevated text-theme-text border border-theme-border transition cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onNavigateHome}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white transition cursor-pointer shadow-xs"
          >
            View Storefront
          </button>
        </div>
      </div>

      {/* Admin Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b-2 border-theme-border">
        {[
          { id: 'overview', label: t.admin.overview, icon: TrendingUp },
          { id: 'orders', label: t.admin.manageOrders, icon: Package, badge: orders.length },
          { id: 'products', label: t.admin.manageProducts, icon: ShoppingBag, badge: products.length },
          { id: 'services', label: t.admin.manageServices, icon: Calendar, badge: services.length },
          { id: 'payments', label: t.admin.paymentsLog, icon: DollarSign, badge: payments.length },
          { id: 'translations', label: t.admin.translationsManager, icon: Globe },
          { id: 'mpesa', label: t.admin.mpesaConfig, icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-theme-accent text-theme-accent-text border-2 border-theme-border shadow-xs'
                  : 'bg-theme-surface hover:bg-theme-elevated text-theme-text border-2 border-theme-border'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-theme-surface p-5 rounded-2xl border-2 border-theme-border shadow-xs text-theme-text">
              <div className="text-stone-500 text-xs font-semibold uppercase">{t.admin.totalRevenue}</div>
              <div className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
                {formatPrice(stats.totalRevenue)}
              </div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">
                {stats.paidOrdersCount} Paid Orders (M-Pesa)
              </div>
            </div>

            <div className="bg-theme-surface p-5 rounded-2xl border-2 border-theme-border shadow-xs text-theme-text">
              <div className="text-stone-500 text-xs font-semibold uppercase">{t.admin.totalOrders}</div>
              <div className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
                {stats.totalOrders}
              </div>
              <div className="text-[11px] text-amber-600 font-bold mt-1">
                {stats.pendingOrders} Pending Fulfillment
              </div>
            </div>

            <div className="bg-theme-surface p-5 rounded-2xl border-2 border-theme-border shadow-xs text-theme-text">
              <div className="text-stone-500 text-xs font-semibold uppercase">{t.admin.productsCount}</div>
              <div className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
                {stats.productsCount}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">
                + {stats.servicesCount} Active Services
              </div>
            </div>

            <div className="bg-theme-surface p-5 rounded-2xl border-2 border-theme-border shadow-xs text-theme-text">
              <div className="text-stone-500 text-xs font-semibold uppercase">{t.admin.lowStockAlert}</div>
              <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
                {stats.lowStockCount}
              </div>
              <div className="text-[11px] text-stone-500 mt-1">Items &lt; 20 units remaining</div>
            </div>
          </div>

          {/* Recent Orders Overview */}
          <div className="bg-theme-surface p-6 rounded-3xl border-2 border-theme-border shadow-xs text-theme-text space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">{t.admin.recentOrders}</h3>
              <button
                onClick={() => setActiveTab('orders')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                {t.common.viewAll}
              </button>
            </div>

            <div className="divide-y divide-theme-border text-xs">
              {orders.slice(0, 5).map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-extrabold text-stone-900 font-mono">{ord.orderNumber}</div>
                    <div className="text-stone-500">{ord.customerName} • {ord.county}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-stone-900">{formatPrice(ord.totalAmount)}</div>
                    <div className="text-[11px] text-stone-500 uppercase">{ord.orderStatus}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. ORDERS MANAGEMENT TAB */}
      {activeTab === 'orders' && (
        <div className="bg-theme-surface p-6 rounded-3xl border-2 border-theme-border shadow-xs text-theme-text space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900">{t.admin.manageOrders}</h3>
            <span className="text-xs text-stone-500">{orders.length} total orders</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-theme-border text-theme-muted uppercase font-semibold">
                  <th className="py-3 px-2">Order #</th>
                  <th className="py-3 px-2">Customer</th>
                  <th className="py-3 px-2">Destination</th>
                  <th className="py-3 px-2">Items</th>
                  <th className="py-3 px-2">Amount</th>
                  <th className="py-3 px-2">Payment (M-Pesa)</th>
                  <th className="py-3 px-2">Order Status</th>
                  <th className="py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-theme-elevated">
                    <td className="py-3 px-2 font-mono font-bold text-stone-900">{ord.orderNumber}</td>
                    <td className="py-3 px-2">
                      <div className="font-semibold text-stone-900">{ord.customerName}</div>
                      <div className="text-stone-500">{ord.customerPhone}</div>
                    </td>
                    <td className="py-3 px-2 text-stone-600">{ord.town}, {ord.county}</td>
                    <td className="py-3 px-2">{ord.items.length} items</td>
                    <td className="py-3 px-2 font-bold text-stone-900">{formatPrice(ord.totalAmount)}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ord.paymentStatus === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.paymentStatus}
                      </span>
                      {ord.mpesaReceiptNumber && (
                        <div className="font-mono text-[10px] text-stone-500">{ord.mpesaReceiptNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={ord.orderStatus}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as any)}
                        className="px-2 py-1 bg-stone-100 border border-stone-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                      >
                        <option value="pending">Pending</option>
                        <option value="payment_pending">Payment Pending</option>
                        <option value="paid">Paid</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => handleUpdateOrderStatus(ord.id, 'delivered')}
                        className="text-emerald-700 hover:text-emerald-900 font-bold"
                      >
                        Deliver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. PRODUCTS MANAGEMENT TAB */}
      {activeTab === 'products' && (
        <div className="bg-theme-surface p-6 rounded-3xl border-2 border-theme-border shadow-xs text-theme-text space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-theme-text">{t.admin.manageProducts}</h3>
              <p className="text-xs text-theme-muted">Add and manage multilingual product listings</p>
            </div>
            <button
              onClick={() => {
                resetProductForm();
                setEditingProduct(null);
                setProductModalOpen(true);
              }}
              className="px-4 py-2 bg-theme-accent hover:opacity-90 text-theme-accent-text rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs border-2 border-theme-border"
            >
              <Plus className="w-4 h-4" />
              <span>{t.admin.addProduct}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-theme-border text-theme-muted uppercase font-semibold">
                  <th className="py-3 px-2">Image</th>
                  <th className="py-3 px-2">SKU</th>
                  <th className="py-3 px-2">Name (English & Kiswahili)</th>
                  <th className="py-3 px-2">Origin</th>
                  <th className="py-3 px-2">Price (KES)</th>
                  <th className="py-3 px-2">Stock</th>
                  <th className="py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-theme-elevated">
                    <td className="py-2.5 px-2">
                      <img
                        src={prod.images[0]}
                        alt={prod.name.en}
                        className="w-10 h-10 rounded-lg object-cover bg-theme-elevated border border-theme-border"
                      />
                    </td>
                    <td className="py-2.5 px-2 font-mono font-medium text-theme-muted">{prod.sku}</td>
                    <td className="py-2.5 px-2">
                      <div className="font-bold text-theme-text">{prod.name.en}</div>
                      <div className="text-theme-muted italic text-[11px]">{prod.name.sw}</div>
                    </td>
                    <td className="py-2.5 px-2 text-theme-muted">{prod.origin}</td>
                    <td className="py-2.5 px-2 font-bold text-theme-text">{formatPrice(prod.price)}</td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${
                        prod.stockQuantity < 15 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {prod.stockQuantity}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 flex items-center gap-2">
                      <button
                        onClick={() => openEditProduct(prod)}
                        className="p-1.5 text-theme-muted hover:text-theme-accent cursor-pointer"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-1.5 text-theme-muted hover:text-rose-600 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SERVICES MANAGEMENT TAB */}
      {activeTab === 'services' && (
        <div className="bg-theme-surface p-6 rounded-3xl border-2 border-theme-border shadow-xs text-theme-text space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-theme-text">{t.admin.manageServices}</h3>
              <p className="text-xs text-theme-muted">Manage safari guides, green energy audits, and translations</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-theme-border text-theme-muted uppercase font-semibold">
                  <th className="py-3 px-2">Service Name</th>
                  <th className="py-3 px-2">Provider</th>
                  <th className="py-3 px-2">Location</th>
                  <th className="py-3 px-2">Duration</th>
                  <th className="py-3 px-2">Fee (KES)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {services.map((serv) => (
                  <tr key={serv.id} className="hover:bg-theme-elevated">
                    <td className="py-3 px-2">
                      <div className="font-bold text-theme-text">{serv.name.en}</div>
                      <div className="text-theme-muted italic text-[11px]">{serv.name.sw}</div>
                    </td>
                    <td className="py-3 px-2 font-semibold text-theme-text">{serv.provider}</td>
                    <td className="py-3 px-2 text-theme-muted">{serv.location}</td>
                    <td className="py-3 px-2 text-theme-muted">{serv.duration}</td>
                    <td className="py-3 px-2 font-bold text-theme-text">{formatPrice(serv.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. PAYMENTS LEDGER TAB */}
      {activeTab === 'payments' && (
        <div className="bg-theme-surface p-6 rounded-3xl border-2 border-theme-border shadow-xs text-theme-text space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-theme-text">{t.admin.paymentsLog}</h3>
            <span className="text-xs text-theme-muted">M-Pesa STK Push Audit Trail</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-theme-border text-theme-muted uppercase font-semibold">
                  <th className="py-3 px-2">Date</th>
                  <th className="py-3 px-2">Receipt</th>
                  <th className="py-3 px-2">Order #</th>
                  <th className="py-3 px-2">Phone</th>
                  <th className="py-3 px-2">Amount</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Environment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-theme-elevated">
                    <td className="py-2.5 px-2 text-theme-muted font-mono">{new Date(p.createdAt).toLocaleString()}</td>
                    <td className="py-2.5 px-2 font-mono font-bold text-emerald-700">{p.mpesaReceiptNumber || 'PENDING'}</td>
                    <td className="py-2.5 px-2 font-mono text-theme-text">{p.orderNumber}</td>
                    <td className="py-2.5 px-2 font-mono text-theme-text">{p.phoneNumber}</td>
                    <td className="py-2.5 px-2 font-bold text-theme-text">{formatPrice(p.amount)}</td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : p.status === 'failed' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 uppercase text-[10px] font-mono text-theme-muted">{p.environment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TRANSLATIONS MANAGEMENT TAB */}
      {activeTab === 'translations' && (
        <div className="bg-theme-surface p-6 sm:p-8 rounded-3xl border-2 border-theme-border shadow-xs text-theme-text space-y-6">
          <div>
            <h3 className="text-base font-bold text-theme-text">{t.admin.translationsManager}</h3>
            <p className="text-xs text-theme-muted mt-0.5">
              Review and manage 6-language translations for catalog items and interface strings.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <div key={lang.code} className="p-4 rounded-2xl bg-theme-elevated border-2 border-theme-border text-center">
                <span className="text-3xl block mb-1">{lang.flag}</span>
                <div className="font-bold text-xs text-theme-text">{lang.nativeName}</div>
                <div className="text-[10px] text-theme-muted">{lang.name} ({lang.code})</div>
                <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                  100% Translated
                </span>
              </div>
            ))}
          </div>

          {/* Sample Product Multilingual Matrix */}
          <div className="border-2 border-theme-border rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-theme-accent">
              Sample Catalog Item Localization Check (Kenyan AA Coffee)
            </h4>
            <div className="space-y-2 text-xs">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const sample = products[0]?.name[lang.code] || 'N/A';
                return (
                  <div key={lang.code} className="flex items-center gap-3 p-2 bg-theme-elevated rounded-xl border border-theme-border">
                    <span className="text-lg shrink-0">{lang.flag}</span>
                    <span className="w-16 font-bold text-theme-muted uppercase">{lang.code}</span>
                    <span className="text-theme-text font-medium">{sample}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. M-PESA DARAJA SETTINGS & SIMULATION TAB */}
      {activeTab === 'mpesa' && (
        <div className="bg-theme-surface p-6 sm:p-8 rounded-3xl border-2 border-theme-border shadow-xs text-theme-text space-y-6">
          <div>
            <h3 className="text-base font-bold text-theme-text">{t.admin.mpesaConfig}</h3>
            <p className="text-xs text-theme-muted mt-0.5">
              Inspect Safaricom Daraja API environment variables and test STK push gateway connectivity.
            </p>
          </div>

          {mpesaConfig && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-theme-elevated border-2 border-theme-border space-y-2 text-xs">
                <div className="font-bold text-theme-text uppercase tracking-wider">Gateway Configuration</div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Environment</span>
                  <span className="font-mono font-bold uppercase text-emerald-700">
                    {mpesaConfig.environment}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Shortcode</span>
                  <span className="font-mono font-bold text-theme-text">{mpesaConfig.shortcode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Consumer Key Status</span>
                  <span className="font-bold text-emerald-700">
                    {mpesaConfig.hasConsumerKey ? 'Configured' : 'Using Sandbox Fallback'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Callback Webhook</span>
                  <span className="font-mono text-[11px] truncate max-w-[180px] text-theme-text">{mpesaConfig.callbackUrl}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-theme-elevated border-2 border-theme-border space-y-2 text-xs text-theme-text">
                <div className="font-bold text-theme-accent uppercase tracking-wider">
                  Daraja Integration Guide
                </div>
                <p className="text-[11px] leading-relaxed text-theme-muted">
                  To connect your official Safaricom credentials, provide the following variables in your hosting environment:
                </p>
                <div className="font-mono text-[10px] bg-theme-surface p-2.5 rounded-lg border border-theme-border space-y-1 text-theme-text">
                  <div>MPESA_CONSUMER_KEY=...</div>
                  <div>MPESA_CONSUMER_SECRET=...</div>
                  <div>MPESA_SHORTCODE=174379</div>
                  <div>MPESA_PASSKEY=bfb279f9aa...</div>
                  <div>MPESA_ENVIRONMENT=sandbox (or production)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Product Modal with 6 Language Inputs */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-theme-surface text-theme-text rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-2 border-theme-border space-y-4 my-8 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b-2 border-theme-border pb-3">
              <h3 className="text-lg font-bold text-theme-text">
                {editingProduct ? t.admin.editProduct : t.admin.addProduct}
              </h3>
              <button
                onClick={() => setProductModalOpen(false)}
                className="p-1 rounded-full text-theme-muted hover:text-theme-text hover:bg-theme-elevated transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Multilingual Names */}
              <div className="space-y-2 p-3.5 bg-theme-elevated rounded-2xl border-2 border-theme-border">
                <div className="font-bold text-theme-text uppercase tracking-wider">
                  Product Name (in 6 Languages)
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <div key={lang.code} className="flex items-center gap-2">
                    <span className="text-base shrink-0">{lang.flag}</span>
                    <span className="w-14 font-semibold text-theme-muted uppercase">{lang.code} *</span>
                    <input
                      type="text"
                      required={lang.code === 'en'}
                      value={prodNames[lang.code]}
                      onChange={(e) =>
                        setProdNames({ ...prodNames, [lang.code]: e.target.value })
                      }
                      placeholder={`Product Name in ${lang.nativeName}`}
                      className="flex-1 px-3 py-1.5 bg-theme-surface border-2 border-theme-border rounded-lg text-xs text-theme-text font-semibold placeholder:text-theme-muted focus:border-theme-accent focus:outline-hidden"
                    />
                  </div>
                ))}
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-theme-text mb-1">Price (KES) *</label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="1850"
                    className="w-full px-3 py-2 bg-theme-surface border-2 border-theme-border rounded-xl text-theme-text font-semibold placeholder:text-theme-muted focus:border-theme-accent focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-theme-text mb-1">Discount Price (KES)</label>
                  <input
                    type="number"
                    value={prodDiscountPrice}
                    onChange={(e) => setProdDiscountPrice(e.target.value)}
                    placeholder="1650"
                    className="w-full px-3 py-2 bg-theme-surface border-2 border-theme-border rounded-xl text-theme-text font-semibold placeholder:text-theme-muted focus:border-theme-accent focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-theme-text mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="25"
                    className="w-full px-3 py-2 bg-theme-surface border-2 border-theme-border rounded-xl text-theme-text font-semibold placeholder:text-theme-muted focus:border-theme-accent focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Category & Origin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-theme-text mb-1">Category *</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-theme-surface border-2 border-theme-border rounded-xl text-theme-text font-semibold focus:border-theme-accent focus:outline-hidden"
                  >
                    <option value="cat_coffee">Kenyan Coffee & Tea</option>
                    <option value="cat_crafts">Handmade Crafts & Art</option>
                    <option value="cat_textiles">Kitenge & Fashion</option>
                    <option value="cat_organic">Organic Farm Goods</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-theme-text mb-1">Origin / Location *</label>
                  <input
                    type="text"
                    required
                    value={prodOrigin}
                    onChange={(e) => setProdOrigin(e.target.value)}
                    placeholder="e.g. Nyeri County, Mount Kenya"
                    className="w-full px-3 py-2 bg-theme-surface border-2 border-theme-border rounded-xl text-theme-text font-semibold placeholder:text-theme-muted focus:border-theme-accent focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block font-bold text-theme-text mb-1">Image URL</label>
                <input
                  type="text"
                  value={prodImage}
                  onChange={(e) => setProdImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-theme-surface border-2 border-theme-border rounded-xl text-theme-text font-semibold placeholder:text-theme-muted focus:border-theme-accent focus:outline-hidden"
                />
              </div>

              {/* Multilingual Descriptions */}
              <div className="space-y-2 p-3.5 bg-theme-elevated rounded-2xl border-2 border-theme-border">
                <div className="font-bold text-theme-text uppercase tracking-wider">
                  Product Description (English & Kiswahili)
                </div>
                <div>
                  <label className="block font-semibold text-theme-muted mb-1">🇬🇧 English Description *</label>
                  <textarea
                    rows={2}
                    required
                    value={prodDescs.en}
                    onChange={(e) => setProdDescs({ ...prodDescs, en: e.target.value })}
                    className="w-full px-3 py-1.5 bg-theme-surface border-2 border-theme-border rounded-lg text-theme-text font-semibold placeholder:text-theme-muted"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-theme-muted mb-1">🇰🇪 Kiswahili Description</label>
                  <textarea
                    rows={2}
                    value={prodDescs.sw}
                    onChange={(e) => setProdDescs({ ...prodDescs, sw: e.target.value })}
                    className="w-full px-3 py-1.5 bg-theme-surface border-2 border-theme-border rounded-lg text-theme-text font-semibold placeholder:text-theme-muted"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 bg-theme-elevated hover:bg-theme-surface border-2 border-theme-border rounded-xl font-bold text-theme-text cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-theme-accent hover:opacity-90 text-theme-accent-text rounded-xl font-bold shadow-xs cursor-pointer border-2 border-theme-border"
                >
                  {t.admin.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
