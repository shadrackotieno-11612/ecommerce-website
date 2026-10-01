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
      <div className="relative w-full max-w-3xl bg-stone-900 rounded-3xl shadow-2xl overflow-hidden border border-stone-800 my-8 max-h-[90vh] flex flex-col md:flex-row animate-in zoom-in-95 text-stone-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-stone-950/80 backdrop-blur-md text-stone-400 hover:text-white shadow-md transition cursor-pointer border border-stone-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Column */}
        <div className="md:w-1/2 bg-stone-950 relative min-h-[300px]">
          <img
            src={product.images[0]}
            alt={localizedName}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 bg-stone-950/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-semibold flex items-center gap-1.5 border border-stone-800">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>{product.origin}</span>
          </div>
        </div>

        {/* Details Column */}
        <div className="p-6 md:p-8 md:w-1/2 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-400">
              <span className="font-semibold text-amber-400 uppercase tracking-wider">
                {product.categoryName || 'Kenyan Goods'}
              </span>
              <span className="font-mono text-stone-500">SKU: {product.sku}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white leading-snug font-['Outfit',sans-serif]">
              {localizedName}
            </h2>

            {/* Rating */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center text-amber-400 font-bold">
                <Star className="w-4 h-4 fill-current mr-0.5" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-stone-600">•</span>
              <span className="text-stone-400">{product.reviewCount} customer reviews</span>
              <span className="text-stone-600">•</span>
              <span className="font-semibold text-emerald-400">Verified Kenyan Producer</span>
            </div>

            {/* Price */}
            <div className="py-2 border-y border-stone-800 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400 font-['Outfit',sans-serif]">
                {formatPrice(product.discountPrice || product.price)}
              </span>
              {product.discountPrice && (
                <span className="text-sm text-stone-500 line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
              {localizedDesc}
            </p>

            {/* Stock status */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-400">{t.common.status}:</span>
              {isOutOfStock ? (
                <span className="font-bold text-rose-500">{t.common.outOfStock}</span>
              ) : (
                <span className="font-bold text-emerald-400">
                  {t.common.inStock} ({product.stockQuantity} units)
                </span>
              )}
            </div>

            {product.weight && (
              <div className="text-xs text-stone-400">
                <span className="font-semibold text-stone-300">Package Specs:</span> {product.weight}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-stone-800 space-y-3">
            <div className="flex items-center gap-3">
              {/* Quantity */}
              <div className="flex items-center border border-stone-700 rounded-xl bg-stone-950">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-stone-300 hover:text-white font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="px-2 text-xs font-bold text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  className="px-3 py-2 text-stone-300 hover:text-white font-bold cursor-pointer"
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t.products.addToCart}</span>
              </button>

              {/* Wishlist */}
              <button
                onClick={() => toggleWishlist(product)}
                className={`p-3 rounded-xl border transition cursor-pointer ${
                  isFavorited
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-400'
                    : 'bg-stone-950 border-stone-700 text-stone-400 hover:text-rose-400'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-stone-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Safaricom M-Pesa STK Push Instant Payment Protected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
