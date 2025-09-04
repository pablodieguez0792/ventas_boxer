import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [cartOpen, setCartOpen] = useState(true);

  // Persist cart to localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('posCart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        setCartItems(parsed.cartItems || []);
        setSelectedCustomer(parsed.selectedCustomer || null);
        setDiscountType(parsed.discountType || 'percentage');
        setDiscountValue(parsed.discountValue || 0);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    const cartData = {
      cartItems,
      selectedCustomer,
      discountType,
      discountValue
    };
    localStorage.setItem('posCart', JSON.stringify(cartData));
  }, [cartItems, selectedCustomer, discountType, discountValue]);

  const addToCart = (product, quantity = 1, price = null) => {
    const finalPrice = price || product.price;
    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + quantity, price: finalPrice }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        ...product,
        quantity,
        price: finalPrice
      }]);
    }
  };

  const updateCartItem = (id, updates) => {
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeFromCart = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    setDiscountValue(0);
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discountValue) / 100 
    : discountValue;
  
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * 0.21; // 21% IVA
  const total = taxableAmount + taxAmount;

  const value = {
    // State
    cartItems,
    selectedCustomer,
    discountType,
    discountValue,
    cartOpen,
    
    // Calculated values
    subtotal,
    discountAmount,
    taxAmount,
    total,
    
    // Actions
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    setSelectedCustomer,
    setDiscountType,
    setDiscountValue,
    setCartOpen,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
