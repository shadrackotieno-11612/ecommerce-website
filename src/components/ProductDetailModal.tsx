import React, { useState } from 'react';
import { Product } from '../types/index.ts';
import { useI18n } from '../i18n/index.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { X, Star, ShoppingBag, Heart, ShieldCheck, MapPin, Truck, ArrowLeft } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { t, translateField, formatPrice } = useI18n();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const isFavorited = isInWishlist(product.id);
  const localizedName = translateField(product.name);
  const localizedDesc = translateField(product.description);
  const isOutOfStock = product.stockQuantity <= 0;

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart(product, 'product', quantity);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-theme-surface rounded-3xl shadow-2xl overflow-hidden border-2 border-theme-border my-8 max-h-[90vh] flex flex-col md:flex-row animate-in zoom-in-95 text-theme-text">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-theme-surface/90 backdrop-blur-md text-theme-muted hover:text-theme-text shadow-md transition cursor-pointer border-2 border-theme-border"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Column */}
        <div className="md:w-1/2 bg-theme-elevated relative min-h-[300px]">
          <img
            src={product.images[0]}
            alt={localizedName}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 bg-theme-surface/90 backdrop-blur-md px-3 py-1 rounded-full text-theme-text text-xs font-semibold flex items-center gap-1.5 border border-theme-border">
            <MapPin className="w-3.5 h-3.5 text-theme-accent" />
            <span>{product.origin}</span>
          </div>
        </div>

        {/* Details Column */}
        <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-theme-muted">
              <span className="font-bold text-theme-accent uppercase tracking-wider">
                {product.categoryName || 'Kenyan Goods'}
              </span>
              <span className="font-mono text-theme-muted font-bold">SKU: {product.sku}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-theme-text leading-snug font-['Outfit',sans-serif]">
              {localizedName}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-current mr-0.5" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-theme-muted">•</span>
              <span className="text-theme-muted font-semibold">{product.reviewCount} customer reviews</span>
              <span className="text-theme-muted">•</span>
              <span className="font-bold text-emerald-600">Verified Kenyan Producer</span>
            </div>

            {/* Price */}
            <div className="py-2 border-y-2 border-theme-border flex items-baseline gap-2">
              <span className="text-2xl font-black text-theme-accent font-['Outfit',sans-serif]">
                {formatPrice(product.discountPrice || product.price)}
              </span>
              {product.discountPrice && product.discountPrice < product.price && (
                <span className="text-sm text-theme-muted font-bold line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            <p className="text-theme-muted text-xs sm:text-sm leading-relaxed font-medium">
              {localizedDesc}
            </p>

            {/* Stock status */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-theme-muted font-semibold">{t.common.status}:</span>
              {isOutOfStock ? (
                <span className="font-bold text-rose-600">{t.common.outOfStock}</span>
              ) : (
                <span className="font-bold text-emerald-600">
                  {t.common.inStock} ({product.stockQuantity} units)
                </span>
              )}
            </div>

            {product.weight && (
              <div className="text-xs text-theme-muted">
                <span className="font-bold text-theme-text">Package Specs:</span> {product.weight}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t-2 border-theme-border space-y-3">
            <div className="flex items-center gap-3">
              {/* Quantity */}
              <div className="flex items-center border-2 border-theme-border rounded-xl bg-theme-elevated text-theme-text">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-theme-text hover:opacity-80 font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="px-2 text-xs font-bold text-theme-text">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  className="px-3 py-2 text-theme-text hover:opacity-80 font-bold cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 py-3 px-4 bg-theme-accent hover:opacity-90 text-theme-accent-text font-black rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 border-2 border-theme-border"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t.products.addToCart}</span>
              </button>

              {/* Wishlist */}
              <button
                onClick={() => toggleWishlist(product)}
                className={`p-3 rounded-xl border-2 transition cursor-pointer ${
                  isFavorited
                    ? 'bg-rose-600 text-white border-rose-700'
                    : 'bg-theme-surface border-theme-border text-theme-muted hover:text-rose-600'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-theme-muted font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safaricom M-Pesa STK Push Instant Payment Protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
