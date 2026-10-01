import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Service } from '../types/index.ts';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Product | Service, itemType: 'product' | 'service', quantity?: number) => boolean;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  hasPhysicalItems: boolean;
  hasServices: boolean;
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
  checkoutModalOpen: boolean;
  setCheckoutModalOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = 'zawadi_shopping_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Failed to persist cart:', e);
    }
  }, [cartItems]);

  const addToCart = (
    item: Product | Service,
    itemType: 'product' | 'service',
    quantity: number = 1
  ): boolean => {
    const existingIndex = cartItems.findIndex((ci) => ci.itemId === item.id);
    const price = (item as Product).discountPrice || item.price;
    const name = item.name.en || Object.values(item.name)[0];
    const image = item.images && item.images.length ? item.images[0] : '';
    const stockQuantity = (item as Product).stockQuantity;

    if (existingIndex > -1) {
      const existing = cartItems[existingIndex];
      const newQty = existing.quantity + quantity;
      if (itemType === 'product' && stockQuantity !== undefined && newQty > stockQuantity) {
        return false;
      }
      const updated = [...cartItems];
      updated[existingIndex] = { ...existing, quantity: newQty };
      setCartItems(updated);
    } else {
      if (itemType === 'product' && stockQuantity !== undefined && quantity > stockQuantity) {
        return false;
      }
      setCartItems([
        ...cartItems,
        {
          id: `ci_${Date.now()}_${item.id}`,
          itemId: item.id,
          itemType,
          name,
          price,
          quantity,
          image,
          stockQuantity,
        },
      ]);
    }

    setCartDrawerOpen(true);
    return true;
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter((i) => i.itemId !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems(
      cartItems.map((item) => {
        if (item.itemId === itemId) {
          if (item.stockQuantity !== undefined && quantity > item.stockQuantity) {
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const hasPhysicalItems = cartItems.some((i) => i.itemType === 'product');
  const hasServices = cartItems.some((i) => i.itemType === 'service');

  // Delivery fee: KES 250 for physical products inside Kenya, free for services or over KES 10,000
  const deliveryFee = hasPhysicalItems && subtotal < 10000 && subtotal > 0 ? 250 : 0;
  const discount = 0;
  const totalAmount = subtotal + deliveryFee - discount;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        deliveryFee,
        discount,
        totalAmount,
        hasPhysicalItems,
        hasServices,
        cartDrawerOpen,
        setCartDrawerOpen,
        checkoutModalOpen,
        setCheckoutModalOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
