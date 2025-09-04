import React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  IconButton,
  Fab,
} from '@mui/material';
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material';
import SearchResults from '../components/SearchResults';
import CartSidebar from '../components/CartSidebar';
import { useCart } from '../contexts/CartContext';

const MainSale = () => {
  const {
    cartItems,
    selectedCustomer,
    discountType,
    discountValue,
    cartOpen,
    subtotal,
    discountAmount,
    taxAmount,
    total,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    setSelectedCustomer,
    setDiscountType,
    setDiscountValue,
    setCartOpen,
  } = useCart();

  return (
    <Box sx={{ display: 'flex', height: '100vh', pt: 4.5 }}>
      {/* Main Content */}
      <Box sx={{ 
        flexGrow: 1, 
        p: 1, 
        mr: cartOpen ? '450px' : '60px',
        transition: 'margin-right 0.3s ease'
      }}>
        <Container maxWidth="xl" sx={{ p: 0 }}>
          {/* Unified Search and Results */}
          <SearchResults 
            onProductSelect={addToCart}
            cartItemsCount={cartItems.length}
          />


        </Container>
      </Box>

      {/* Cart Toggle Button */}
      {!cartOpen && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1300,
          }}
          onClick={() => setCartOpen(true)}
        >
          <ShoppingCart />
          {cartItems.length > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                bgcolor: 'error.main',
                color: 'white',
                borderRadius: '50%',
                width: 20,
                height: 20,
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {cartItems.length}
            </Box>
          )}
        </Fab>
      )}

      {/* Cart Sidebar */}
      <CartSidebar 
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </Box>
  );
};

export default MainSale;
