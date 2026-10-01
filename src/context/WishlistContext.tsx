import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types/index.ts';
import { useAuth } from './AuthContext.tsx';

interface WishlistContextType {
  wishlistIds: string[];
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const WISHLIST_STORAGE_KEY = 'zawadi_wishlist';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch (e) {
      console.warn('Failed to save wishlist:', e);
    }
  }, [wishlistIds]);

  // Fetch backend wishlist if logged in
  useEffect(() => {
    if (!token || !user) return;
    async function fetchUserWishlist() {
      try {
        const res = await fetch('/api/wishlist', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const products: Product[] = await res.json();
          setWishlistIds(products.map((p) => p.id));
        }
      } catch (err) {
        console.warn('Failed to fetch user wishlist:', err);
      }
    }
    fetchUserWishlist();
  }, [token, user]);

  const toggleWishlist = async (product: Product) => {
    const isPresent = wishlistIds.includes(product.id);
    const updated = isPresent
      ? wishlistIds.filter((id) => id !== product.id)
      : [...wishlistIds, product.id];

    setWishlistIds(updated);

    if (token) {
      try {
        await fetch('/api/wishlist/toggle', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId: product.id }),
        });
      } catch (err) {
        console.warn('Failed to sync wishlist with backend:', err);
      }
    }
  };

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
