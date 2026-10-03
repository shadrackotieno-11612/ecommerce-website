import React from 'react';
import { useI18n } from '../i18n/index.tsx';
import { useCart } from '../context/CartContext.tsx';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Info } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const { t, formatPrice } = useI18n();
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartDrawerOpen,
    setCartDrawerOpen,
    subtotal,
    deliveryFee,
    totalAmount,
    hasPhysicalItems,
    hasServices,
    setCheckoutModalOpen,
  } = useCart();

  if (!cartDrawerOpen) return null;

  const handleProceedToCheckout = () => {
    setCartDrawerOpen(false);
    setCheckoutModalOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setCartDrawerOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-theme-surface border-l-2 border-theme-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 text-theme-text">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b-2 border-theme-border flex items-center justify-between bg-theme-elevated">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-theme-accent" />
              <h2 className="text-lg font-bold text-theme-text">{t.cart.title}</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-theme-accent text-theme-accent-text">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} {t.common.items}
              </span>
            </div>
            <button
              onClick={() => setCartDrawerOpen(false)}
              className="p-2 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-surface transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mixed Order Notice */}
          {hasPhysicalItems && hasServices && (
            <div className="bg-theme-elevated border-b-2 border-theme-border px-4 py-2.5 flex items-start gap-2 text-xs text-theme-text">
              <Info className="w-4 h-4 text-theme-accent shrink-0 mt-0.5" />
              <span>{t.cart.mixedNotice}</span>
            </div>
          )}

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y-2 divide-theme-border">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-theme-elevated flex items-center justify-center text-theme-muted">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-theme-text text-lg">{t.cart.empty}</h3>
                  <p className="text-theme-muted text-sm mt-1 max-w-xs">{t.cart.emptyDesc}</p>
                </div>
                <button
                  onClick={() => setCartDrawerOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-theme-accent hover:opacity-90 text-theme-accent-text font-bold text-sm transition cursor-pointer shadow-xs border-2 border-theme-border"
                >
                  {t.cart.startShopping}
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="py-4 flex gap-3.5 first:pt-0 last:pb-0">
                  {/* Thumbnail */}
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=400&q=80'}
                    alt={item.name}
                    className="w-18 h-18 rounded-xl object-cover bg-theme-elevated shrink-0 border-2 border-theme-border"
                  />

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-theme-text text-sm leading-snug line-clamp-1">
                          {item.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.itemId)}
                          className="text-theme-muted hover:text-rose-600 transition p-1 cursor-pointer"
                          title={t.cart.remove}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="text-[11px] font-bold text-theme-accent uppercase">
                        {item.itemType === 'product' ? 'Physical Good' : 'Service'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity controls */}
                      <div className="flex items-center border-2 border-theme-border rounded-lg bg-theme-elevated">
                        <button
                          onClick={() => updateQuantity(item.itemId, item.quantity - 1)}
                          className="p-1 text-theme-text hover:opacity-80 transition cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-xs font-bold text-theme-text min-w-[20px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.itemId, item.quantity + 1)}
                          className="p-1 text-theme-text hover:opacity-80 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-theme-text">
                          {formatPrice(item.price * item.quantity)}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-[10px] text-theme-muted">
                            {formatPrice(item.price)} each
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Trigger */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-6 border-t-2 border-theme-border bg-theme-elevated space-y-3">
              <div className="space-y-1.5 text-xs text-theme-muted">
                <div className="flex justify-between">
                  <span>{t.cart.subtotal}</span>
                  <span className="font-semibold text-theme-text">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t.cart.deliveryFee}</span>
                  <span className="font-semibold text-theme-text">
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-700 font-bold">{t.cart.freeDelivery}</span>
                    ) : (
                      formatPrice(deliveryFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-theme-text pt-2 border-t-2 border-theme-border">
                  <span>{t.cart.total}</span>
                  <span className="text-theme-accent">{formatPrice(totalAmount)}</span>
                </div>
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full py-3.5 rounded-xl bg-theme-accent hover:opacity-90 text-theme-accent-text font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 border-2 border-theme-border"
              >
                <span>{t.cart.proceedToCheckout}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-theme-muted pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-theme-accent" />
                <span>{t.common.poweredByMpesa}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
