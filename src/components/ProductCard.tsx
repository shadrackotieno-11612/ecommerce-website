import React from 'react';
import { Product } from '../types/index.ts';
import { useI18n } from '../i18n/index.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { Heart, ShoppingBag, Star, MapPin } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelectProduct?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelectProduct }) => {
  const { t, translateField, formatPrice } = useI18n();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isFavorited = isInWishlist(product.id);
  const localizedName = translateField(product.name);
  const localizedDesc = translateField(product.description);
  const isOutOfStock = product.stockQuantity <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 'product', 1);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div
      onClick={() => onSelectProduct?.(product)}
      className="group bg-white rounded-2xl border-2 border-stone-200 hover:border-amber-400 shadow-xs hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col cursor-pointer text-stone-900"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square bg-stone-100 overflow-hidden">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?auto=format&fit=crop&w=800&q=80'}
          alt={localizedName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Origin Badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-stone-900 text-[11px] font-bold flex items-center gap-1 border border-stone-300 shadow-xs">
          <MapPin className="w-3 h-3 text-amber-600" />
          <span className="truncate max-w-[120px]">{product.origin}</span>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition cursor-pointer shadow-md border ${
            isFavorited
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-white/90 text-stone-700 hover:text-rose-600 border-stone-300 hover:bg-white'
          }`}
          title={isFavorited ? t.products.removedFromWishlist : t.products.addedToWishlist}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
        </button>

        {/* Stock / Discount Badges */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          {product.discountPrice && (
            <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs border border-amber-600">
              Sale
            </span>
          )}
          {isOutOfStock ? (
            <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {t.common.outOfStock}
            </span>
          ) : product.stockQuantity < 15 ? (
            <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {product.stockQuantity} left
            </span>
          ) : null}
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating & Review Count */}
          <div className="flex items-center gap-1.5 mb-1.5 text-xs text-stone-600 font-semibold">
            <div className="flex items-center text-amber-600 font-bold">
              <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
            <span>•</span>
            <span>({product.reviewCount} {t.common.reviews})</span>
            {product.weight && (
              <>
                <span>•</span>
                <span className="text-stone-700 font-bold">{product.weight}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="font-black text-stone-950 group-hover:text-amber-700 transition line-clamp-1 text-sm sm:text-base leading-snug">
            {localizedName}
          </h3>

          {/* Short Description */}
          <p className="text-stone-600 text-xs line-clamp-2 mt-1 leading-relaxed font-medium">
            {localizedDesc}
          </p>
        </div>

        {/* Pricing and Add to Cart Button */}
        <div className="mt-4 pt-3 border-t-2 border-stone-100 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
              {t.common.currency}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-amber-700">
                {formatPrice(product.discountPrice || product.price)}
              </span>
              {product.discountPrice && (
                <span className="text-xs text-stone-400 font-bold line-through">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
              isOutOfStock
                ? 'bg-stone-200 text-stone-500 cursor-not-allowed border border-stone-300'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-95'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.products.addToCart}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
