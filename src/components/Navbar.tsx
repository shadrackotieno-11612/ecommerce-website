import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../i18n/index.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { LanguageSelector } from './LanguageSelector.tsx';
import { ContrastSelector } from './ContrastSelector.tsx';
import { LionLogo } from './LionLogo.tsx';
import {
  ShoppingBag,
  Heart,
  User as UserIcon,
  Search,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  Package,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  onSearch: (query: string) => void;
  onOpenAbout: () => void;
  onOpenContact: () => void;
  onOpenChatbot: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onNavigate,
  currentPage,
  onSearch,
  onOpenAbout,
  onOpenContact,
  onOpenChatbot,
}) => {
  const { t } = useI18n();
  const { user, logout, openAuthModal } = useAuth();
  const { itemCount, setCartDrawerOpen } = useCart();
  const { wishlistIds } = useWishlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    if (currentPage !== 'products') {
      onNavigate('products');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-theme-surface/95 backdrop-blur-md border-b-2 border-theme-border text-theme-text transition-all shadow-xs">
      {/* Top Banner with Delivery & Support */}
      <div className="bg-theme-elevated text-theme-text text-xs py-1.5 px-4 border-b border-theme-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-black flex items-center gap-1.5">
              <span>🚚</span>
              <span>Nairobi Same-Day & 47 Counties Express Courier</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-theme-muted text-xs font-semibold">
            <button
              onClick={onOpenChatbot}
              className="text-theme-accent hover:underline font-black flex items-center gap-1 cursor-pointer transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
              <span>Simba AI Assistance</span>
            </button>
            <span>•</span>
            <button onClick={onOpenAbout} className="hover:text-theme-text transition cursor-pointer">
              {t.nav.aboutUs}
            </button>
            <span>•</span>
            <button onClick={onOpenContact} className="hover:text-theme-text transition cursor-pointer">
              {t.nav.contact}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2 md:gap-4">
          {/* Brand Logo with Majestic Lion */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('home')}
              className="cursor-pointer transition hover:opacity-95"
            >
              <LionLogo size="md" showText={true} />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <button
                onClick={() => onNavigate('home')}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                  currentPage === 'home'
                    ? 'text-theme-accent-text bg-theme-accent border-2 border-theme-border'
                    : 'text-theme-text hover:bg-theme-elevated'
                }`}
              >
                {t.nav.home}
              </button>
              <button
                onClick={() => onNavigate('products')}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                  currentPage === 'products'
                    ? 'text-theme-accent-text bg-theme-accent border-2 border-theme-border'
                    : 'text-theme-text hover:bg-theme-elevated'
                }`}
              >
                {t.nav.products}
              </button>
              <button
                onClick={() => onNavigate('services')}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition cursor-pointer ${
                  currentPage === 'services'
                    ? 'text-theme-accent-text bg-theme-accent border-2 border-theme-border'
                    : 'text-theme-text hover:bg-theme-elevated'
                }`}
              >
                {t.nav.services}
              </button>
            </nav>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-sm mx-2">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.common.search}
                className="w-full pl-9 pr-4 py-2 bg-theme-surface border-2 border-theme-border rounded-full text-xs text-theme-text font-semibold placeholder:text-theme-muted focus:outline-hidden focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20 transition"
              />
              <Search className="w-3.5 h-3.5 text-theme-muted absolute left-3.5 top-2.5" />
            </form>
          </div>

          {/* Right Action Icons: Contrast Selector, Language, Chatbot, Wishlist, Cart, User */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Contrast / Theme Selector */}
            <ContrastSelector />

            {/* Prominent Language Selector */}
            <LanguageSelector />

            {/* Chatbot Launcher Button */}
            <button
              onClick={onOpenChatbot}
              className="p-2 text-theme-accent hover:bg-theme-elevated rounded-full transition relative cursor-pointer border-2 border-theme-border bg-theme-surface"
              title="Chat with Simba AI Assistant"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1 right-1"></span>
            </button>

            {/* Wishlist Button */}
            <button
              onClick={() => {
                if (!user) {
                  openAuthModal('login');
                } else {
                  onNavigate('dashboard');
                }
              }}
              className="p-2 text-theme-text hover:text-rose-600 hover:bg-theme-elevated rounded-full transition relative cursor-pointer border-2 border-theme-border bg-theme-surface"
              title={t.nav.wishlist}
            >
              <Heart className="w-4 h-4" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-theme-accent hover:opacity-90 text-theme-accent-text rounded-full font-bold text-xs transition relative cursor-pointer border-2 border-theme-border shadow-xs"
              title={t.nav.cart}
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-theme-accent-text" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 min-w-4 h-4 px-1 bg-theme-surface text-theme-text border border-theme-border text-[10px] font-black rounded-full flex items-center justify-center shadow-xs">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="hidden xl:inline font-black">{t.nav.cart}</span>
            </button>

            {/* User Account / Login Button */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 pl-3 bg-theme-surface hover:bg-theme-elevated border-2 border-theme-border rounded-full transition cursor-pointer"
                >
                  <span className="text-xs font-bold text-theme-text max-w-[100px] truncate hidden sm:inline">
                    {user.fullName.split(' ')[0]}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-theme-accent text-theme-accent-text flex items-center justify-center text-xs font-black uppercase shadow-xs">
                    {user.fullName.charAt(0)}
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl shadow-2xl bg-theme-surface border-2 border-theme-border divide-y divide-theme-border z-50 animate-in fade-in text-theme-text">
                    <div className="px-4 py-3 bg-theme-elevated rounded-t-2xl">
                      <p className="text-[11px] font-semibold text-theme-muted">Signed in as</p>
                      <p className="text-sm font-black text-theme-text truncate">{user.fullName}</p>
                      <p className="text-xs text-theme-muted truncate">{user.email}</p>
                      {user.role === 'admin' && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black bg-theme-accent text-theme-accent-text border border-theme-border">
                          Administrator
                        </span>
                      )}
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onNavigate('dashboard');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-theme-text hover:bg-theme-elevated cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-theme-muted" />
                        {t.nav.dashboard}
                      </button>
                      <button
                        onClick={() => {
                          onNavigate('dashboard');
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-theme-text hover:bg-theme-elevated cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5 text-theme-muted" />
                        {t.orders.title}
                      </button>
                      {user.role === 'admin' && (
                        <button
                          onClick={() => {
                            onNavigate('admin');
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-theme-accent hover:bg-theme-elevated cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-theme-accent" />
                          {t.nav.adminDashboard}
                        </button>
                      )}
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                          onNavigate('home');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-theme-elevated cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        {t.nav.logout}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3.5 py-1.5 text-xs font-bold text-theme-text hover:bg-theme-elevated rounded-full border-2 border-theme-border transition cursor-pointer"
                >
                  {t.nav.login}
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-4 py-1.5 text-xs font-black text-theme-accent-text bg-theme-accent hover:opacity-90 rounded-full shadow-xs transition cursor-pointer hidden sm:inline-block border-2 border-theme-border"
                >
                  {t.nav.register}
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-theme-text hover:bg-theme-elevated border-2 border-theme-border transition cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.common.search}
              className="w-full pl-9 pr-4 py-2 bg-theme-surface border-2 border-theme-border rounded-full text-xs text-theme-text font-semibold placeholder:text-theme-muted focus:outline-hidden focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/20"
            />
            <Search className="w-3.5 h-3.5 text-theme-muted absolute left-3 top-2.5" />
          </form>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t-2 border-theme-border space-y-1">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg font-bold text-theme-text hover:bg-theme-elevated"
            >
              {t.nav.home}
            </button>
            <button
              onClick={() => {
                onNavigate('products');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg font-bold text-theme-text hover:bg-theme-elevated"
            >
              {t.nav.products}
            </button>
            <button
              onClick={() => {
                onNavigate('services');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg font-bold text-theme-text hover:bg-theme-elevated"
            >
              {t.nav.services}
            </button>
            <button
              onClick={() => {
                onOpenChatbot();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg font-bold text-theme-accent bg-theme-elevated border-2 border-theme-border flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>🦁 Simba AI Chatbot Assistance</span>
            </button>
            <button
              onClick={() => {
                onOpenAbout();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg font-bold text-theme-text hover:bg-theme-elevated"
            >
              {t.nav.aboutUs}
            </button>
            <button
              onClick={() => {
                onOpenContact();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg font-bold text-theme-text hover:bg-theme-elevated"
            >
              {t.nav.contact}
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg font-bold text-theme-accent bg-theme-elevated border border-theme-border"
              >
                {t.nav.adminDashboard}
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
