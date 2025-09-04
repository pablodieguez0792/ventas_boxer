import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import ChatbotWidget from './components/ChatbotWidget';
import VentasContainer from './pages/VentasContainer';
import MercadoLibreContainer from './pages/MercadoLibreContainer';
import CRMContainer from './pages/CRMContainer';
import { CartProvider } from './contexts/CartContext';

// Create Material-UI theme optimized for POS
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
    success: {
      main: '#2e7d32',
    },
    warning: {
      main: '#ed6c02',
    },
    error: {
      main: '#d32f2f',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

function App() {
  return (
    <CartProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', height: '100vh' }}>
            <Sidebar />
            <Box sx={{ flex: 1, overflow: 'auto', backgroundColor: 'background.default' }}>
              <Routes>
                <Route path="/ventas/*" element={<VentasContainer />} />
                <Route path="/mercadolibre/*" element={<MercadoLibreContainer />} />
                <Route path="/crm/*" element={<CRMContainer />} />
                <Route path="/" element={<VentasContainer />} />
              </Routes>
              {/* Global floating chatbot */}
              <ChatbotWidget />
            </Box>
          </Box>
        </Router>
      </ThemeProvider>
    </CartProvider>
  );
}

export default App;
