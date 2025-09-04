import React, { useState } from 'react';
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  TextField,
  IconButton,
  Avatar,
  Chip,
} from '@mui/material';
import {
  ViewList,
  ViewModule,
  Delete,
  Remove,
  Add,
  Inventory,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

const ProductList = ({ items, onUpdateItem, onRemoveItem }) => {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'cards'

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setViewMode(newView);
    }
  };

  const updateQuantity = (itemId, change) => {
    const item = items.find(i => i.id === itemId);
    const newQuantity = Math.max(1, item.quantity + change);
    onUpdateItem(itemId, 'quantity', newQuantity);
  };

  // DataGrid columns for list view
  const columns = [
    {
      field: 'product_name',
      headerName: 'Descripción',
      flex: 2,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" fontWeight="bold">
            {params.row.product.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.product.internal_code}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'brand',
      headerName: 'Marca',
      width: 120,
      valueGetter: (params) => params.row.product.brand,
    },
    {
      field: 'location',
      headerName: 'Ubicación',
      width: 100,
      valueGetter: (params) => params.row.product.location || '-',
    },
    {
      field: 'stock',
      headerName: 'Stock',
      width: 80,
      valueGetter: (params) => params.row.product.stock,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color={params.value > 10 ? 'success' : params.value > 0 ? 'warning' : 'error'}
        />
      ),
    },
    {
      field: 'quantity',
      headerName: 'Cantidad',
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => updateQuantity(params.row.id, -1)}
            disabled={params.row.quantity <= 1}
          >
            <Remove />
          </IconButton>
          <TextField
            size="small"
            value={params.row.quantity}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              onUpdateItem(params.row.id, 'quantity', Math.max(1, value));
            }}
            sx={{ width: 60 }}
            inputProps={{ style: { textAlign: 'center' } }}
          />
          <IconButton
            size="small"
            onClick={() => updateQuantity(params.row.id, 1)}
          >
            <Add />
          </IconButton>
        </Box>
      ),
    },
    {
      field: 'unit_price',
      headerName: 'Precio Unit.',
      width: 120,
      renderCell: (params) => (
        <TextField
          size="small"
          value={params.row.unit_price}
          onChange={(e) => {
            const value = parseFloat(e.target.value) || 0;
            onUpdateItem(params.row.id, 'unit_price', value);
          }}
          sx={{ width: 100 }}
          inputProps={{ style: { textAlign: 'right' } }}
        />
      ),
    },
    {
      field: 'subtotal',
      headerName: 'Subtotal',
      width: 120,
      valueGetter: (params) => params.row.quantity * params.row.unit_price,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="bold">
          ${params.value.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 100,
      renderCell: (params) => (
        <IconButton
          color="error"
          onClick={() => onRemoveItem(params.row.id)}
        >
          <Delete />
        </IconButton>
      ),
    },
  ];

  const renderListView = () => (
    <DataGrid
      rows={items}
      columns={columns}
      autoHeight
      disableRowSelectionOnClick
      hideFooter
      sx={{
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid #f0f0f0',
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: '#f5f5f5',
        },
      }}
    />
  );

  const renderCardView = () => (
    <Grid container spacing={2}>
      {items.map((item) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardMedia sx={{ height: 140, position: 'relative' }}>
              {item.product.image_url ? (
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Box
                  sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5',
                  }}
                >
                  <Inventory sx={{ fontSize: 60, color: 'text.secondary' }} />
                </Box>
              )}
              <Chip
                label={`Stock: ${item.product.stock}`}
                size="small"
                color={item.product.stock > 10 ? 'success' : item.product.stock > 0 ? 'warning' : 'error'}
                sx={{ position: 'absolute', top: 8, right: 8 }}
              />
            </CardMedia>
            
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="h6" component="div" gutterBottom>
                {item.product.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {item.product.brand} • {item.product.internal_code}
              </Typography>
              {item.product.location && (
                <Typography variant="caption" color="text.secondary">
                  📍 {item.product.location}
                </Typography>
              )}
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" color="primary">
                  ${item.unit_price.toLocaleString()} c/u
                </Typography>
                <Typography variant="h5" color="success.main" fontWeight="bold">
                  ${(item.quantity * item.unit_price).toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
            
            <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => updateQuantity(item.id, -1)}
                  disabled={item.quantity <= 1}
                >
                  <Remove />
                </IconButton>
                <TextField
                  size="small"
                  value={item.quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    onUpdateItem(item.id, 'quantity', Math.max(1, value));
                  }}
                  sx={{ width: 60 }}
                  inputProps={{ style: { textAlign: 'center' } }}
                />
                <IconButton
                  size="small"
                  onClick={() => updateQuantity(item.id, 1)}
                >
                  <Add />
                </IconButton>
              </Box>
              
              <IconButton
                color="error"
                onClick={() => onRemoveItem(item.id)}
              >
                <Delete />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  if (items.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 200,
          color: 'text.secondary',
        }}
      >
        <Inventory sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h6">No hay artículos agregados</Typography>
        <Typography variant="body2">
          Use el buscador para agregar productos al carrito
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* View Toggle */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={handleViewChange}
          size="small"
        >
          <ToggleButton value="list">
            <ViewList sx={{ mr: 1 }} />
            Lista
          </ToggleButton>
          <ToggleButton value="cards">
            <ViewModule sx={{ mr: 1 }} />
            Tarjetas
          </ToggleButton>
        </ToggleButtonGroup>

        <Typography variant="body2" color="text.secondary">
          Total de artículos: {items.reduce((sum, item) => sum + item.quantity, 0)}
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {viewMode === 'list' ? renderListView() : renderCardView()}
      </Box>
    </Box>
  );
};

export default ProductList;
