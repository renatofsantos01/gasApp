import React, { createContext, useState, useContext, ReactNode } from 'react';
import { CartItem, Product } from '../types';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingItem = prevItems?.find((item) => item?.product?.id === product?.id);
      if (existingItem) {
        return prevItems?.map((item) =>
          item?.product?.id === product?.id
            ? { ...item, quantity: (item?.quantity ?? 0) + quantity }
            : item
        ) ?? [];
      }
      return [...(prevItems ?? []), { product, quantity }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prevItems) => prevItems?.filter((item) => item?.product?.id !== productId) ?? []);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prevItems) =>
      prevItems?.map((item) =>
        item?.product?.id === productId ? { ...item, quantity } : item
      ) ?? []
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemQuantity = (productId: string): number => {
    const item = items?.find((item) => item?.product?.id === productId);
    return item?.quantity ?? 0;
  };

  const itemCount = items?.reduce((sum, item) => sum + (item?.quantity ?? 0), 0) ?? 0;
  const total = items?.reduce((sum, item) => sum + (item?.product?.price ?? 0) * (item?.quantity ?? 0), 0) ?? 0;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
