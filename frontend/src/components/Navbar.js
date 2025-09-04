import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
} from '@mui/material';
import {
  PointOfSale,
  AccountBalanceWallet,
  Description,
} from '@mui/icons-material';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Venta Principal', icon: <PointOfSale /> },
    { path: '/caja', label: 'Caja', icon: <AccountBalanceWallet /> },
    { path: '/presupuestos', label: 'Presupuestos', icon: <Description /> },
  ];

  return (
    <AppBar position="static" elevation={2}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          🚗 POS Autopartes - Ventas Boxer
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              variant={location.pathname === item.path ? 'outlined' : 'text'}
              sx={{
                backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                borderColor: location.pathname === item.path ? 'rgba(255,255,255,0.5)' : 'transparent',
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Chip
          label="Sistema Activo"
          color="success"
          size="small"
          sx={{ ml: 2 }}
        />
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
