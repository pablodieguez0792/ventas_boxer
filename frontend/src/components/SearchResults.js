import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  TextField,
  InputAdornment,
  Autocomplete,
  Avatar,
} from '@mui/material';
import {
  Add,
  ViewList,
  ViewModule,
  Search,
  Inventory,
  LocationOn,
  LocalOffer,
} from '@mui/icons-material';
import { apiService } from '../utils/api';

const SearchResults = ({ onProductSelect, cartItemsCount }) => {
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  const handleSearch = async (query = searchQuery) => {
    // If query is an event object (from button click), use searchQuery instead
    const searchTerm = typeof query === 'string' ? query : searchQuery;
    
    if (!searchTerm || !searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await apiService.searchProducts(searchTerm, 50);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching products:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle part number click to search for all products with that part number
  const handlePartNumberClick = async (partNumber) => {
    setSearchQuery(partNumber);
    await handleSearch(partNumber);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddToCart = (product) => {
    onProductSelect(product, 1);
  };

  const renderCardView = () => (
    <Grid container spacing={1}>
      {searchResults.map((product) => (
        <Grid item xs={12} sm={6} md={4} lg={2.4} key={product.id}>
          <Card 
            sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4,
              }
            }}
          >
            <CardMedia
              component="img"
              height="80"
              image={product.image_url ? `http://localhost:8000${product.image_url}` : '/api/placeholder/150/80'}
              alt={product.name}
              sx={{ 
                objectFit: 'cover',
                bgcolor: product.image_url ? 'transparent' : 'grey.100',
              }}
            />
            <CardContent sx={{ flexGrow: 1, p: 1 }}>
              <Typography variant="body2" component="h3" gutterBottom noWrap sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                {product.name}
              </Typography>
              
              <Typography variant="caption" color="text.secondary" gutterBottom sx={{ display: 'block' }}>
                <strong>{product.brand}</strong> • {product.vehicle_application ? product.vehicle_application.substring(0, 30) + '...' : 'Universal'}
              </Typography>

              <Box sx={{ mb: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
                <Chip 
                  label={product.internal_code} 
                  size="small" 
                  color="primary" 
                  sx={{ height: 16, fontSize: '0.65rem', cursor: 'pointer' }}
                  onClick={() => handlePartNumberClick(product.internal_code)}
                />
                {product.original_code && (
                  <Chip 
                    label={product.original_code} 
                    size="small" 
                    variant="outlined"
                    sx={{ height: 16, fontSize: '0.65rem', cursor: 'pointer' }}
                    onClick={() => handlePartNumberClick(product.original_code)}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Inventory sx={{ fontSize: 12, mr: 0.25, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {product.stock}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ fontSize: 12, mr: 0.25, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {product.location}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="subtitle1" color="primary" sx={{ mb: 0.5, fontSize: '1rem', fontWeight: 600 }}>
                ${product.price.toLocaleString('es-AR')}
              </Typography>

              {product.vehicle_application && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontSize: '0.65rem', lineHeight: 1.2 }}>
                  {product.vehicle_application.substring(0, 50)}...
                </Typography>
              )}
            </CardContent>
            
            <Box sx={{ p: 1, pt: 0 }}>
              <Button
                variant="contained"
                fullWidth
                size="small"
                startIcon={<Add sx={{ fontSize: 14 }} />}
                onClick={() => handleAddToCart(product)}
                disabled={product.stock === 0}
                sx={{ height: 28, fontSize: '0.75rem' }}
              >
                Agregar
              </Button>
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderListView = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      {searchResults.map((product) => (
        <Paper 
          key={product.id} 
          sx={{ 
            p: 1, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            '&:hover': { bgcolor: 'action.hover' },
            minHeight: 60
          }}
        >
          {/* Imagen */}
          <Avatar
            src={product.image_url ? `http://localhost:8000${product.image_url}` : '/api/placeholder/50/50'}
            alt={product.name}
            sx={{ width: 50, height: 50, flexShrink: 0 }}
          />
          
          {/* Información Principal */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="body2" fontWeight="600" noWrap sx={{ maxWidth: 200 }}>
                {product.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight="500">
                {product.brand}
              </Typography>
            </Box>
            
            {/* Códigos y Aplicación */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={product.internal_code} 
                size="small" 
                color="primary" 
                sx={{ height: 20, fontSize: '0.7rem', cursor: 'pointer' }}
                onClick={() => handlePartNumberClick(product.internal_code)}
              />
              {product.original_code && (
                <Chip 
                  label={product.original_code} 
                  size="small" 
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.7rem', cursor: 'pointer' }}
                  onClick={() => handlePartNumberClick(product.original_code)}
                />
              )}
              {product.vehicle_application && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {product.vehicle_application.substring(0, 40)}...
                </Typography>
              )}
            </Box>
          </Box>
          
          {/* Stock y Ubicación */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Inventory sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ minWidth: 30 }}>{product.stock}</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
              {product.location}
            </Typography>
          </Box>
          
          {/* Precio y Acción */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Typography variant="body1" fontWeight="bold" color="primary" sx={{ minWidth: 80, textAlign: 'right' }}>
              ${product.price.toLocaleString('es-AR')}
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add sx={{ fontSize: 16 }} />}
              onClick={() => handleAddToCart(product)}
              disabled={product.stock === 0}
              sx={{ height: 32, fontSize: '0.75rem', minWidth: 80 }}
            >
              Agregar
            </Button>
          </Box>
        </Paper>
      ))}
    </Box>
  );

  return (
    <Box sx={{ mb: 1 }}>
      {/* Unified Search Bar */}
      <Paper sx={{ p: 1.5, mb: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
          <Search sx={{ mr: 1 }} />
          Búsqueda de Artículos
          {cartItemsCount > 0 && (
            <Chip 
              label={`${cartItemsCount} en carrito`} 
              size="small" 
              color="primary" 
              sx={{ ml: 2 }}
            />
          )}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <Autocomplete
            fullWidth
            freeSolo
            options={searchResults.map(product => product.name)}
            value={searchQuery}
            onInputChange={(event, newValue) => {
              setSearchQuery(newValue || '');
              if (newValue && newValue.length >= 2) {
                // Debounced search
                clearTimeout(searchTimeoutRef.current);
                searchTimeoutRef.current = setTimeout(() => {
                  handleSearch(newValue);
                }, 300);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                placeholder="Buscar por nombre, código, marca o aplicación..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'action.active', mr: 1 }} />
                    </InputAdornment>
                  ),
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
              />
            )}
          />
          <Button 
            variant="contained" 
            onClick={() => handleSearch(searchQuery)}
            disabled={isLoading || searchQuery.trim().length < 2}
            size="small"
            sx={{ minWidth: 80 }}
          >
            {isLoading ? 'Buscando...' : 'Buscar'}
          </Button>
        </Box>

        {searchResults.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {searchResults.length} encontrados
            </Typography>
            
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
              sx={{ height: 28 }}
            >
              <ToggleButton value="cards" aria-label="vista en tarjetas" sx={{ px: 1 }}>
                <ViewModule sx={{ fontSize: 16 }} />
              </ToggleButton>
              <ToggleButton value="list" aria-label="vista en lista" sx={{ px: 1 }}>
                <ViewList sx={{ fontSize: 16 }} />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}
      </Paper>

      {/* Results Display */}
      {searchResults.length > 0 && (
        <Paper sx={{ p: 1.5 }}>
          {viewMode === 'cards' ? renderCardView() : renderListView()}
        </Paper>
      )}

      {searchResults.length === 0 && searchQuery && !isLoading && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No se encontraron artículos para "{searchQuery}"
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default SearchResults;
