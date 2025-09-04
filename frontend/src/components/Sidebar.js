import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Box,
  Divider,
  Collapse,
  Tooltip,
} from '@mui/material';
import {
  Menu,
  ChevronLeft,
  ExpandLess,
  ExpandMore,
  PointOfSale,
  AccountBalanceWallet,
  Description,
  ShoppingCart,
  Store,
  People,
  SmartToy,
  Api,
  Agriculture,
  Business,
} from '@mui/icons-material';

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_COLLAPSED = 64;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [ventasOpen, setVentasOpen] = useState(true);
  const [mercadoLibreOpen, setMercadoLibreOpen] = useState(false);
  const [crmOpen, setCrmOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [conexionesApiOpen, setConexionesApiOpen] = useState(false);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const ventasItems = [
    { path: '/ventas', label: 'Sistema de Ventas', icon: <PointOfSale /> },
  ];

  const mercadoLibreItems = [
    { path: '/mercadolibre', label: 'Gestión Integral ML', icon: <Store /> },
  ];

  const crmItems = [
    { path: '/crm', label: 'Gestión de Clientes', icon: <People /> },
  ];

  const chatbotItems = [
    { path: '/chatbot', label: 'Chatbot', icon: <SmartToy /> },
  ];

  const conexionesApiItems = [
    { path: '/conexiones-api/rural-santa-fe', label: 'Rural Santa Fe', icon: <Agriculture /> },
    { path: '/conexiones-api/promotive', label: 'Promotive', icon: <Business /> },
  ];

  const isActive = (path) => location.pathname === path;

  const renderMenuItem = (item, nested = false) => (
    <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
      <Tooltip title={!open ? item.label : ''} placement="right">
        <ListItemButton
          onClick={() => navigate(item.path)}
          sx={{
            minHeight: 48,
            justifyContent: open ? 'initial' : 'center',
            px: nested ? 4 : 2.5,
            backgroundColor: isActive(item.path) ? 'primary.main' : 'transparent',
            color: isActive(item.path) ? 'white' : 'inherit',
            '&:hover': {
              backgroundColor: isActive(item.path) ? 'primary.dark' : 'action.hover',
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: open ? 3 : 'auto',
              justifyContent: 'center',
              color: isActive(item.path) ? 'white' : 'inherit',
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.label} 
            sx={{ opacity: open ? 1 : 0 }}
          />
        </ListItemButton>
      </Tooltip>
    </ListItem>
  );

  const renderSection = (title, items, sectionOpen, setSectionOpen, icon) => (
    <>
      <ListItem disablePadding sx={{ display: 'block' }}>
        <Tooltip title={!open ? title : ''} placement="right">
          <ListItemButton
            onClick={() => open && setSectionOpen(!sectionOpen)}
            sx={{
              minHeight: 48,
              justifyContent: open ? 'initial' : 'center',
              px: 2.5,
              backgroundColor: 'grey.100',
              '&:hover': {
                backgroundColor: 'grey.200',
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 3 : 'auto',
                justifyContent: 'center',
              }}
            >
              {icon}
            </ListItemIcon>
            <ListItemText 
              primary={title} 
              sx={{ opacity: open ? 1 : 0 }}
            />
            {open && (sectionOpen ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </Tooltip>
      </ListItem>
      <Collapse in={open && sectionOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {items.map(item => renderMenuItem(item, true))}
        </List>
      </Collapse>
    </>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
          boxSizing: 'border-box',
          transition: 'width 0.3s',
          overflowX: 'hidden',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'space-between' : 'center',
          padding: '8px 16px',
          minHeight: 64,
          backgroundColor: 'primary.main',
          color: 'white',
        }}
      >
        {open && (
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 'bold' }}>
            🚗 POS Boxer
          </Typography>
        )}
        <IconButton
          color="inherit"
          onClick={handleDrawerToggle}
          sx={{ color: 'white' }}
        >
          {open ? <ChevronLeft /> : <Menu />}
        </IconButton>
      </Box>
      
      <Divider />
      
      <List>
        {renderSection('Ventas', ventasItems, ventasOpen, setVentasOpen, <PointOfSale />)}
        
        <Divider sx={{ my: 1 }} />
        
        {renderSection('MercadoLibre', mercadoLibreItems, mercadoLibreOpen, setMercadoLibreOpen, <Store />)}
        
        <Divider sx={{ my: 1 }} />
        
        {renderSection('CRM', crmItems, crmOpen, setCrmOpen, <People />)}

        <Divider sx={{ my: 1 }} />

        {renderSection('CHATBOT', chatbotItems, chatbotOpen, setChatbotOpen, <SmartToy />)}

        <Divider sx={{ my: 1 }} />

        {renderSection('CONEXIONES API', conexionesApiItems, conexionesApiOpen, setConexionesApiOpen, <Api />)}
      </List>
    </Drawer>
  );
};

export default Sidebar;
