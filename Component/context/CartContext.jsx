import React, { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = useCallback((product, size) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id && item.size === size);
      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1, size }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  }, []);
  const clearCart = () => {
    setCartItems([]); // Clear the cart by setting it to an empty array
  };

  const updateQuantity = (id, size, action) => {
    setCartItems(prevItems => {
      if (action === 'remove') {
        return prevItems.filter(item => item.id !== id || item.size !== size);
      }
      
      return prevItems.map(item => {
        if (item.id === id && item.size === size) {
          const newQuantity = action === 'increase' ? item.quantity + 1 : item.quantity - 1;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
        }
        return item;
      }).filter(Boolean); // Remove any null items
    });
  };
  return (
    <CartContext.Provider 
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};