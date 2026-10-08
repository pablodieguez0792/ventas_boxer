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
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ExpandLess,
  ExpandMore,
  PointOfSale,
  ShoppingCart,
  Business,
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;
const DRAWER_WIDTH_COLLAPSED = 60;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const [ventasOpen, setVentasOpen] = useState(true);
  const [promotiveOpen, setPromotiveOpen] = useState(true);

  const toggleDrawer = () => setOpen(!open);

  const ventasItems = [
    { path: '/ventas', label: 'Sistema de Ventas', icon: <PointOfSale /> },
  ];

  const promotiveItems = [
    { path: '/repuestos', label: 'Repuestos por vehículo', icon: <ShoppingCart /> },
    { path: '/conexiones-api/promotive-api', label: 'Promotive - API', icon: <Business /> },
    { path: '/conexiones-api/promotive-articulos', label: 'Artículos', icon: <ShoppingCart /> },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const renderMenuItem = (item) => (
    <ListItem key={item.path} disablePadding>
      <ListItemButton
        selected={isActive(item.path)}
        onClick={() => navigate(item.path)}
        sx={{
          mx: 1,
          borderRadius: 1,
          justifyContent: open ? 'initial' : 'center',
          '&.Mui-selected': { bgcolor: '#E3F2FD', '&:hover': { bgcolor: '#BBDEFB' } },
          '&:hover': { bgcolor: '#F5F5F5' },
        }}
      >
        <ListItemIcon sx={{
          color: isActive(item.path) ? '#0066CC' : '#757575',
          minWidth: open ? 40 : 'auto',
          justifyContent: 'center',
        }}>
          {item.icon}
        </ListItemIcon>
        {open && (
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontWeight: isActive(item.path) ? 600 : 400,
              color: isActive(item.path) ? '#0066CC' : '#212121',
              fontSize: '0.875rem',
            }}
          />
        )}
      </ListItemButton>
    </ListItem>
  );

  const renderSection = (title, items, sectionOpen, setSectionOpen) => (
    <>
      <ListItem disablePadding>
        <Tooltip title={!open ? title : ''} placement="right">
          <ListItemButton
            onClick={() => open && setSectionOpen(!sectionOpen)}
            sx={{
              mx: 1,
              borderRadius: 1,
              justifyContent: open ? 'initial' : 'center',
              '&:hover': { bgcolor: '#F5F5F5' },
            }}
          >
            <ListItemText
              primary={title}
              sx={{ opacity: open ? 1 : 0 }}
              primaryTypographyProps={{
                fontSize: '0.65rem',
                fontWeight: 600,
                color: '#9E9E9E',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            />
            {open && (sectionOpen ? <ExpandLess sx={{ color: '#9E9E9E', fontSize: 16 }} /> : <ExpandMore sx={{ color: '#9E9E9E', fontSize: 16 }} />)}
          </ListItemButton>
        </Tooltip>
      </ListItem>
      <Collapse in={open ? sectionOpen : true} timeout="auto" unmountOnExit={false}>
        <List disablePadding>
          {items.map(item => renderMenuItem(item))}
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
        transition: 'width 0.3s ease',
        '& .MuiDrawer-paper': {
          width: open ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED,
          boxSizing: 'border-box',
          bgcolor: '#FAFAFA',
          borderRight: '1px solid #E0E0E0',
          transition: 'width 0.3s ease',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{
        p: open ? 3 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: open ? 'space-between' : 'center',
        minHeight: 64,
      }}>
        {open && (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#0066CC' }}>
              BOXER
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, color: '#757575' }}>
              Ventas
            </Typography>
          </Box>
        )}
        <IconButton onClick={toggleDrawer} size="small">
          {open ? <ChevronLeftIcon /> : <MenuIcon />}
        </IconButton>
      </Box>

      <Divider />

      <List sx={{ pt: 2, flexGrow: 1 }}>
        {renderSection('Ventas', ventasItems, ventasOpen, setVentasOpen)}

        <Divider sx={{ mx: 2, my: 1 }} />

        {renderSection('Promotive', promotiveItems, promotiveOpen, setPromotiveOpen)}
      </List>
    </Drawer>
  );
};

export default Sidebar;
