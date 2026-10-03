import React, { useState, useEffect } from 'react';
import { I18nProvider, useI18n } from './i18n/index.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { WishlistProvider } from './context/WishlistContext.tsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ServiceCard } from './components/ServiceCard.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { CustomerDashboard } from './components/CustomerDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AboutModal } from './components/AboutModal.tsx';
import { ContactModal } from './components/ContactModal.tsx';
import { ChatbotModal } from './components/ChatbotModal.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { Footer } from './components/Footer.tsx';
import { Product, Service, Category } from './types/index.ts';
import {
  Coffee,
  Palette,
  Shirt,
  Apple,
  Compass,
  Briefcase,
  Star,
  ShieldCheck,
  Zap,
  Truck,
  ArrowRight,
  Filter,
  CheckCircle,
  Quote,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

function MainStorefront() {
  const { t, translateField, formatPrice } = useI18n();
  const { user, openAuthModal } = useAuth();
  const { contrastTheme } = useTheme();

  const [currentPage, setCurrentPage] = useState<'home' | 'products' | 'services' | 'dashboard' | 'admin'>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Modals
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [chatbotModalOpen, setChatbotModalOpen] = useState(false);

  // Load catalog data
  useEffect(() => {
    async function loadCatalog() {
      try {
        const [prodRes, servRes, catRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/services'),
          fetch('/api/categories'),
        ]);

        if (prodRes.ok) setProducts(await prodRes.json());
        if (servRes.ok) setServices(await servRes.json());
        if (catRes.ok) setCategories(await catRes.json());
      } catch (err) {
        console.error('Failed to load initial catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  // Filtered and sorted products
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = Object.values(p.name).some((n) => n.toLowerCase().includes(q));
      const desc = Object.values(p.description).some((d) => d.toLowerCase().includes(q));
      const origin = p.origin.toLowerCase().includes(q);
      return name || desc || origin;
    }
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_asc') {
      return (a.discountPrice || a.price) - (b.discountPrice || b.price);
    }
    if (sortBy === 'price_desc') {
      return (b.discountPrice || b.price) - (a.discountPrice || a.price);
    }
    if (sortBy === 'rating') {
      return b.rating - a.rating;
    }
    return 0;
  });

  const filteredServices = services.filter((s) => {
    if (selectedCategory !== 'all' && s.categoryId !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = Object.values(s.name).some((n) => n.toLowerCase().includes(q));
      const desc = Object.values(s.description).some((d) => d.toLowerCase().includes(q));
      const prov = s.provider.toLowerCase().includes(q);
      return name || desc || prov;
    }
    return true;
  });

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Coffee':
        return <Coffee className="w-5 h-5 text-amber-400" />;
      case 'Palette':
        return <Palette className="w-5 h-5 text-emerald-400" />;
      case 'Shirt':
        return <Shirt className="w-5 h-5 text-rose-400" />;
      case 'Apple':
        return <Apple className="w-5 h-5 text-lime-400" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-sky-400" />;
      default:
        return <Briefcase className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col font-['Plus_Jakarta_Sans',sans-serif] bg-theme-bg text-theme-text transition-colors duration-200"
    >
      {/* Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => {
          if (page === 'admin' && user?.role !== 'admin') {
            openAuthModal('login');
          } else if (page === 'dashboard' && !user) {
            openAuthModal('login');
          } else {
            setCurrentPage(page as any);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onSearch={(q) => {
          setSearchQuery(q);
          if (currentPage !== 'products') setCurrentPage('products');
        }}
        onOpenAbout={() => setAboutModalOpen(true)}
        onOpenContact={() => setChatbotModalOpen(true)}
        onOpenChatbot={() => setChatbotModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* VIEW 1: HOME PAGE */}
        {currentPage === 'home' && (
          <div className="space-y-16">
            {/* Hero Section */}
            <Hero
              onExploreProducts={() => {
                setCurrentPage('products');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onExploreServices={() => {
                setCurrentPage('services');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenChatbot={() => setChatbotModalOpen(true)}
            />

            {/* Categories Grid */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <span className="text-xs font-black uppercase tracking-wider text-theme-accent">
                  {t.categories.title}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-theme-text mt-1 font-['Outfit',sans-serif]">
                  Authentic Kenyan Goods & Services
                </h2>
                <p className="text-xs sm:text-sm text-theme-muted font-medium mt-2">
                  {t.categories.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      if (cat.type === 'service') {
                        setCurrentPage('services');
                      } else {
                        setCurrentPage('products');
                      }
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-4 rounded-2xl bg-theme-surface border-2 border-theme-border hover:border-theme-accent hover:shadow-md transition text-center group cursor-pointer shadow-xs text-theme-text"
                  >
                    <div className="w-12 h-12 rounded-xl bg-theme-elevated border border-theme-border flex items-center justify-center mx-auto mb-2.5 group-hover:scale-110 transition-transform">
                      {getCategoryIcon(cat.icon)}
                    </div>
                    <div className="font-bold text-xs text-theme-text group-hover:text-theme-accent transition line-clamp-1">
                      {translateField(cat.name)}
                    </div>
                    <div className="text-[10px] text-theme-muted uppercase font-bold mt-0.5">
                      {cat.type}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Featured Products Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-theme-accent">
                    Handpicked From Kenya
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-theme-text mt-1 font-['Outfit',sans-serif]">
                    {t.products.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-theme-muted font-medium mt-1">
                    {t.products.subtitle}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setCurrentPage('products');
                  }}
                  className="px-5 py-2.5 bg-theme-surface hover:bg-theme-accent hover:text-theme-accent-text text-theme-text border-2 border-theme-border rounded-full text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <span>{t.common.viewAll}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.slice(0, 8).map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelectProduct={(p) => setSelectedProduct(p)}
                  />
                ))}
              </div>
            </section>

            {/* Special Promo Banner */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="relative rounded-3xl overflow-hidden bg-theme-elevated border-2 border-theme-border p-8 sm:p-12 text-theme-text shadow-md">
                <div className="relative z-10 max-w-xl space-y-4">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-theme-accent text-theme-accent-text uppercase tracking-wider border border-theme-border">
                    Safaricom M-Pesa Partner Offer
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-black tracking-tight font-['Outfit',sans-serif] text-theme-text">
                    Free Countrywide Delivery on Orders Over KES 10,000
                  </h3>
                  <p className="text-theme-muted text-xs sm:text-sm leading-relaxed font-semibold">
                    Order authentic Kenyan single-origin coffee, handcrafted soapstone art, or organic honey. Receive automatic free courier delivery across all 47 counties in Kenya.
                  </p>
                  <button
                    onClick={() => {
                      setCurrentPage('products');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-6 py-3 rounded-full bg-theme-accent hover:opacity-90 text-theme-accent-text font-black text-xs sm:text-sm shadow-md border-2 border-theme-border transition cursor-pointer"
                  >
                    Start Shopping Now
                  </button>
                </div>
              </div>
            </section>

            {/* Popular Services Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-theme-accent">
                    Certified Local Specialists
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-theme-text mt-1 font-['Outfit',sans-serif]">
                    {t.services.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-theme-muted font-medium mt-1">
                    {t.services.subtitle}
                  </p>
                </div>
                <button
                  onClick={() => setCurrentPage('services')}
                  className="px-5 py-2.5 bg-theme-surface hover:bg-theme-accent hover:text-theme-accent-text text-theme-text border-2 border-theme-border rounded-full text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
                >
                  <span>{t.common.viewAll}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.slice(0, 3).map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </section>

            {/* Customer Testimonials in Multiple Languages */}
            <section className="bg-theme-elevated/40 py-16 border-y-2 border-theme-border">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-xl mx-auto mb-10">
                  <span className="text-xs font-black uppercase tracking-wider text-theme-accent">
                    Customer Stories
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-theme-text mt-1 font-['Outfit',sans-serif]">
                    Trusted by Kenyans and Global Visitors
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-theme-surface border-2 border-theme-border shadow-xs space-y-4 text-theme-text">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-theme-text text-xs sm:text-sm italic leading-relaxed font-medium">
                      "The Nyeri AA coffee is sublime! Checkout with M-Pesa STK push took less than 15 seconds. Delivered to my apartment in Westlands by 2 PM."
                    </p>
                    <div className="pt-2 border-t-2 border-theme-border flex items-center justify-between text-xs">
                      <div>
                        <div className="font-black text-theme-text">Wambui Karanja</div>
                        <div className="text-theme-muted font-semibold">Nairobi, Kenya 🇰🇪</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-theme-elevated text-theme-text border border-theme-border font-black">
                        Verified Purchase
                      </span>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-theme-surface border-2 border-theme-border shadow-xs space-y-4 text-theme-text">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-theme-text text-xs sm:text-sm italic leading-relaxed font-medium">
                      "We booked the Nairobi National Park half-day wildlife safari through Zawadi Kenya. Our guide was extraordinarily knowledgeable and spotted black rhinos!"
                    </p>
                    <div className="pt-2 border-t-2 border-theme-border flex items-center justify-between text-xs">
                      <div>
                        <div className="font-black text-theme-text">Elena & Carlos Martinez</div>
                        <div className="text-theme-muted font-semibold">Madrid, Spain 🇪🇸</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-theme-elevated text-theme-text border border-theme-border font-black">
                        Safari Service
                      </span>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-theme-surface border-2 border-theme-border shadow-xs space-y-4 text-theme-text">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-theme-text text-xs sm:text-sm italic leading-relaxed font-medium">
                      "手编的马赛 Kiondo 提包太精致了，具有浓厚的东非文化底蕴。全中文界面流畅自如，非常专业快捷！"
                    </p>
                    <div className="pt-2 border-t-2 border-theme-border flex items-center justify-between text-xs">
                      <div>
                        <div className="font-black text-theme-text">张志强 (Zhiqiang Zhang)</div>
                        <div className="text-theme-muted font-semibold">Shanghai, China 🇨🇳</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-theme-elevated text-theme-text border border-theme-border font-black">
                        International Order
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: PRODUCTS CATALOG PAGE */}
        {currentPage === 'products' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-theme-accent">
                Full Catalog
              </span>
              <h1 className="text-3xl font-black text-theme-text mt-1 font-['Outfit',sans-serif]">
                {t.products.title}
              </h1>
              <p className="text-xs sm:text-sm text-theme-muted mt-1">
                Browse authentic Kenyan artisanal wares, specialty coffees, and organic farm produce.
              </p>
            </div>

            {/* Filter Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-theme-surface border-2 border-theme-border shadow-xs text-theme-text">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border-2 border-theme-border ${
                    selectedCategory === 'all'
                      ? 'bg-theme-accent text-theme-accent-text font-bold'
                      : 'bg-theme-elevated text-theme-text hover:bg-theme-surface'
                  }`}
                >
                  {t.common.all} ({products.length})
                </button>
                {categories.filter((c) => c.type === 'product' || c.type === 'both').map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer border-2 border-theme-border ${
                      selectedCategory === cat.id
                        ? 'bg-theme-accent text-theme-accent-text font-bold'
                        : 'bg-theme-elevated text-theme-text hover:bg-theme-surface'
                    }`}
                  >
                    {translateField(cat.name)}
                  </button>
                ))}
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-theme-muted font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 bg-theme-surface border-2 border-theme-border rounded-xl text-xs font-semibold text-theme-text focus:outline-hidden"
                >
                  <option value="featured">Featured</option>
                  <option value="price_asc">{t.products.priceLowHigh}</option>
                  <option value="price_desc">{t.products.priceHighLow}</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {sortedProducts.length === 0 ? (
              <div className="text-center py-16 bg-theme-surface rounded-3xl border-2 border-theme-border space-y-3">
                <Coffee className="w-12 h-12 text-theme-muted mx-auto" />
                <h3 className="font-bold text-theme-text text-base">{t.products.noProductsFound}</h3>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-theme-accent text-theme-accent-text text-xs font-bold rounded-full border-2 border-theme-border"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {sortedProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onSelectProduct={(p) => setSelectedProduct(p)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: SERVICES CATALOG PAGE */}
        {currentPage === 'services' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-theme-accent">
                Certified Trade & Consultation
              </span>
              <h1 className="text-3xl font-black text-theme-text mt-1 font-['Outfit',sans-serif]">
                {t.services.title}
              </h1>
              <p className="text-xs sm:text-sm text-theme-muted mt-1">
                Book professional Kenyan services with instant Safaricom M-Pesa reservation. Physical goods and trade services can be bundled into a single checkout!
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        )}

        {/* VIEW 4: CUSTOMER DASHBOARD */}
        {currentPage === 'dashboard' && (
          <CustomerDashboard onNavigateHome={() => setCurrentPage('home')} />
        )}

        {/* VIEW 5: ADMIN DASHBOARD */}
        {currentPage === 'admin' && (
          <AdminDashboard onNavigateHome={() => setCurrentPage('home')} />
        )}
      </main>

      {/* Floating Chatbot Assistant Widget */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setChatbotModalOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-theme-accent hover:opacity-90 text-theme-accent-text font-bold text-xs sm:text-sm shadow-xl border-2 border-theme-border hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Need help? Chat with Simba AI 24/7"
        >
          <div className="relative">
            <span className="text-xl">🦁</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-theme-border animate-pulse"></span>
          </div>
          <span className="font-extrabold font-['Outfit',sans-serif] tracking-wide">
            Ask Simba AI
          </span>
        </button>
      </div>

      {/* Global Modals & Drawers */}
      <CartDrawer />
      <CheckoutModal onOrderCompleted={() => setCurrentPage('dashboard')} />
      <AuthModal />
      <AboutModal isOpen={aboutModalOpen} onClose={() => setAboutModalOpen(false)} />
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        onOpenChatbot={() => setChatbotModalOpen(true)}
      />
      <ChatbotModal
        isOpen={chatbotModalOpen}
        onClose={() => setChatbotModalOpen(false)}
        onSwitchToEmailForm={() => {
          setChatbotModalOpen(false);
          setContactModalOpen(true);
        }}
      />
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Footer */}
      <Footer
        onNavigate={(p) => setCurrentPage(p as any)}
        onOpenAbout={() => setAboutModalOpen(true)}
        onOpenContact={() => setChatbotModalOpen(true)}
        onOpenChatbot={() => setChatbotModalOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <MainStorefront />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
