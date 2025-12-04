import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Alert,
  Chip,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
} from '@mui/material';
import {
  Store,
  Settings,
  CheckCircle,
  Error,
  CloudSync,
  Api,
  ShoppingCart,
  Inventory,
  People,
  Category,
  Webhook,
  ExpandMore,
  Info,
  Code,
  Link as LinkIcon,
} from '@mui/icons-material';
import { AccountSelector, BulkProductUpload, BulkStockUpdate } from '../../components/TiendaNubeExtensions';

const TiendaNubeAPI = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);

  // Estados para agregar producto
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    sku: '',
    categories: [],
  });
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [productResult, setProductResult] = useState(null);

  // Estados para sincronización
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [tiendaNubeProducts, setTiendaNubeProducts] = useState([]);
  const [editedProducts, setEditedProducts] = useState({});
  const [updatingProducts, setUpdatingProducts] = useState(false);
  const [updateResults, setUpdateResults] = useState(null);

  // Estados para MercadoLibre
  const [mlConnected, setMlConnected] = useState(false);
  const [mlItems, setMlItems] = useState([]);
  const [loadingMlItems, setLoadingMlItems] = useState(false);
  const [mlUserInfo, setMlUserInfo] = useState(null);
  const [verifyingMlConnection, setVerifyingMlConnection] = useState(false);
  const [mlConnectionStatus, setMlConnectionStatus] = useState(null);
  const [mlMappedItems, setMlMappedItems] = useState([]);
  const [selectedMlItems, setSelectedMlItems] = useState([]);
  const [migratingToTN, setMigratingToTN] = useState(false);
  const [migrationResults, setMigrationResults] = useState(null);

  // Endpoints disponibles
  const endpoints = [
    {
      category: 'Autenticación',
      items: [
        {
          method: 'GET',
          path: '/api/tiendanube/status',
          description: 'Obtiene el estado de la conexión con Tienda Nube',
          iconName: 'CheckCircle',
        },
        {
          method: 'GET',
          path: '/api/tiendanube/auth-url',
          description: 'Obtiene la URL de autenticación OAuth',
          iconName: 'LinkIcon',
        },
        {
          method: 'POST',
          path: '/api/tiendanube/callback',
          description: 'Maneja el callback de autenticación OAuth',
          params: '{ "code": "authorization_code" }',
          iconName: 'Code',
        },
      ],
    },
    {
      category: 'Tienda',
      items: [
        {
          method: 'GET',
          path: '/api/tiendanube/store',
          description: 'Obtiene información general de la tienda',
          iconName: 'Store',
        },
      ],
    },
    {
      category: 'Productos',
      items: [
        {
          method: 'GET',
          path: '/api/tiendanube/products',
          description: 'Lista todos los productos de la tienda',
          params: '?page=1&per_page=50&q=search_term',
          iconName: 'Inventory',
        },
        {
          method: 'GET',
          path: '/api/tiendanube/products/{product_id}',
          description: 'Obtiene un producto específico por ID',
          iconName: 'Info',
        },
        {
          method: 'POST',
          path: '/api/tiendanube/products',
          description: 'Crea un nuevo producto en la tienda',
          params: '{ "name": "Producto", "price": 100.00, "stock": 10 }',
          iconName: 'Inventory',
        },
        {
          method: 'PUT',
          path: '/api/tiendanube/products/{product_id}',
          description: 'Actualiza un producto existente',
          params: '{ "name": "Nuevo nombre", "price": 150.00 }',
          iconName: 'Inventory',
        },
        {
          method: 'DELETE',
          path: '/api/tiendanube/products/{product_id}',
          description: 'Elimina un producto de la tienda',
          iconName: 'Inventory',
        },
        {
          method: 'PUT',
          path: '/api/tiendanube/products/{product_id}/variants/{variant_id}/stock',
          description: 'Actualiza el stock de una variante de producto',
          params: '{ "stock": 25 }',
          iconName: 'Inventory',
        },
      ],
    },
    {
      category: 'Órdenes',
      items: [
        {
          method: 'GET',
          path: '/api/tiendanube/orders',
          description: 'Lista todas las órdenes de la tienda',
          params: '?page=1&per_page=50&status=open',
          iconName: 'ShoppingCart',
        },
        {
          method: 'GET',
          path: '/api/tiendanube/orders/{order_id}',
          description: 'Obtiene una orden específica por ID',
          iconName: 'ShoppingCart',
        },
      ],
    },
    {
      category: 'Categorías',
      items: [
        {
          method: 'GET',
          path: '/api/tiendanube/categories',
          description: 'Lista todas las categorías de productos',
          params: '?page=1&per_page=50',
          iconName: 'Category',
        },
      ],
    },
    {
      category: 'Clientes',
      items: [
        {
          method: 'GET',
          path: '/api/tiendanube/customers',
          description: 'Lista todos los clientes de la tienda',
          params: '?page=1&per_page=50',
          iconName: 'People',
        },
      ],
    },
    {
      category: 'Webhooks',
      items: [
        {
          method: 'GET',
          path: '/api/tiendanube/webhooks',
          description: 'Lista todos los webhooks configurados',
          iconName: 'Webhook',
        },
        {
          method: 'POST',
          path: '/api/tiendanube/webhooks',
          description: 'Crea un nuevo webhook',
          params: '{ "url": "https://example.com/webhook", "event": "order/created" }',
          iconName: 'Webhook',
        },
        {
          method: 'DELETE',
          path: '/api/tiendanube/webhooks/{webhook_id}',
          description: 'Elimina un webhook existente',
          iconName: 'Webhook',
        },
      ],
    },
  ];

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/tiendanube/status');
      const data = await response.json();
      setConnectionStatus(data);
      setIsConnected(data.connected || false);
      
      if (data.connected && data.store_info) {
        setStoreInfo(data.store_info);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
  };

  const handleGetAuthUrl = async () => {
    try {
      const response = await fetch('/api/tiendanube/auth-url');
      const data = await response.json();
      
      if (data.success && data.auth_url) {
        window.open(data.auth_url, '_blank');
        alert('Se abrió la ventana de autenticación. Después de autorizar, copia el código y úsalo para conectar.');
      }
    } catch (error) {
      console.error('Error getting auth URL:', error);
      alert('Error al obtener URL de autenticación');
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tiendanube/store');
      const data = await response.json();
      
      if (data.success) {
        setStoreInfo(data.data);
        setIsConnected(true);
        alert('Conexión exitosa con Tienda Nube');
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET':
        return '#4caf50';
      case 'POST':
        return '#2196f3';
      case 'PUT':
        return '#ff9800';
      case 'DELETE':
        return '#f44336';
      default:
        return '#757575';
    }
  };

  const getIcon = (iconName) => {
    const icons = {
      CheckCircle: <CheckCircle />,
      LinkIcon: <LinkIcon />,
      Code: <Code />,
      Store: <Store />,
      Inventory: <Inventory />,
      Info: <Info />,
      ShoppingCart: <ShoppingCart />,
      Category: <Category />,
      People: <People />,
      Webhook: <Webhook />,
    };
    return icons[iconName] || <Api />;
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      alert('Por favor completa al menos el nombre y precio del producto');
      return;
    }

    setUploadingProduct(true);
    setProductResult(null);

    try {
      const productData = {
        name: { es: newProduct.name },
        description: { es: newProduct.description },
        price: parseFloat(newProduct.price),
        variants: [{
          stock: parseInt(newProduct.stock) || 0,
          sku: newProduct.sku || null,
        }],
        published: true,
      };

      const response = await fetch('/api/tiendanube/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      const data = await response.json();

      if (data.success) {
        setProductResult({ success: true, product: data.data });
        setNewProduct({
          name: '',
          description: '',
          price: '',
          stock: '',
          sku: '',
          categories: [],
        });
        alert('Producto creado exitosamente en Tienda Nube!');
      } else {
        setProductResult({ success: false, error: data.message });
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      setProductResult({ success: false, error: error.message });
      alert('Error al crear producto');
    } finally {
      setUploadingProduct(false);
    }
  };

  const handleLoadProducts = async () => {
    setLoadingProducts(true);
    setUpdateResults(null);

    try {
      const response = await fetch('/api/tiendanube/products?per_page=100');
      const data = await response.json();

      console.log('Respuesta completa de la API:', data); // Debug: ver respuesta completa

      if (data.success) {
        console.log('Primer producto raw:', data.data?.[0]); // Debug: ver estructura del primer producto
        
        const products = data.data.map(p => {
          // En Tienda Nube, los precios pueden estar en el producto o en la variante
          const variant = p.variants?.[0] || {};
          
          console.log(`Producto ${p.id}:`, {
            productPrice: p.price,
            productPromo: p.promotional_price,
            variantPrice: variant.price,
            variantPromo: variant.promotional_price,
          }); // Debug: ver precios de cada fuente
          
          // Convertir precios a números (vienen como strings)
          const parsePrice = (price) => {
            if (price === null || price === undefined || price === '') return 0;
            return parseFloat(price) || 0;
          };
          
          return {
            id: p.id,
            name: p.name?.es || p.name || 'Sin nombre',
            sku: variant.sku || '',
            // Los precios están en las variantes como strings
            price: parsePrice(variant.price) || parsePrice(p.price),
            promotional_price: parsePrice(variant.promotional_price) || parsePrice(p.promotional_price),
            stock: parseInt(variant.stock) || 0,
            variantId: variant.id,
          };
        });
        
        console.log('Productos procesados:', products.slice(0, 3)); // Debug: ver primeros 3 productos procesados
        setTiendaNubeProducts(products);
        setEditedProducts({});
        alert(`${products.length} productos cargados desde Tienda Nube`);
      } else {
        alert('Error al cargar productos: ' + data.message);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Error al cargar productos');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleEditProduct = (productId, field, value) => {
    setEditedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const handleUpdateProducts = async () => {
    const productsToUpdate = Object.keys(editedProducts).filter(
      id => Object.keys(editedProducts[id]).length > 0
    );

    if (productsToUpdate.length === 0) {
      alert('No hay cambios para actualizar');
      return;
    }

    setUpdatingProducts(true);
    const results = { total: productsToUpdate.length, updated: 0, errors: [] };

    try {
      for (const productId of productsToUpdate) {
        const product = tiendaNubeProducts.find(p => p.id.toString() === productId);
        const changes = editedProducts[productId];

        try {
          // En Tienda Nube, los precios están en las variantes, no en el producto
          // Necesitamos actualizar la variante con todos los cambios
          if (product.variantId && (changes.stock !== undefined || changes.price !== undefined || changes.promotional_price !== undefined)) {
            const variantUpdateData = {};
            
            if (changes.stock !== undefined) {
              variantUpdateData.stock = parseInt(changes.stock);
            }
            
            if (changes.price !== undefined) {
              variantUpdateData.price = parseFloat(changes.price).toString(); // Tienda Nube espera string
            }
            
            if (changes.promotional_price !== undefined) {
              const promoPrice = parseFloat(changes.promotional_price);
              variantUpdateData.promotional_price = promoPrice > 0 ? promoPrice.toString() : null;
            }

            const variantResponse = await fetch(
              `/api/tiendanube/products/${productId}/variants/${product.variantId}`,
              {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(variantUpdateData),
              }
            );

            const variantResult = await variantResponse.json();
            if (!variantResult.success) {
              throw new Error('Error al actualizar variante');
            }
          }

          results.updated++;
        } catch (error) {
          results.errors.push({ name: product.name, error: error.message });
        }
      }

      setUpdateResults(results);
      alert(`Actualización completada: ${results.updated} productos actualizados`);
      
      // Recargar productos
      if (results.updated > 0) {
        handleLoadProducts();
      }
    } catch (error) {
      console.error('Error updating products:', error);
      alert('Error en la actualización');
    } finally {
      setUpdatingProducts(false);
    }
  };

  // Funciones de MercadoLibre
  const handleVerifyMlConnection = async () => {
    setVerifyingMlConnection(true);
    try {
      const response = await fetch('/api/mercadolibre/verify-connection', {
        method: 'POST'
      });
      const data = await response.json();
      
      setMlConnectionStatus(data);
      setMlConnected(data.connected);
      
      if (data.user_info) {
        setMlUserInfo(data.user_info);
      }
      
      // No usar alert para evitar que cambie de pestaña
      console.log('[ML] Verificación completada:', data);
      
    } catch (error) {
      console.error('Error verifying ML connection:', error);
      setMlConnectionStatus({
        connected: false,
        message: 'Error al verificar conexión: ' + error.message,
        token_renewed: false
      });
    } finally {
      setVerifyingMlConnection(false);
    }
  };

  const handleLoadMlItems = async () => {
    setLoadingMlItems(true);
    try {
      // Obtener estado de conexión
      const statusResponse = await fetch('/api/mercadolibre/status');
      const statusData = await statusResponse.json();
      setMlConnected(statusData.connected);
      
      if (statusData.user_info) {
        setMlUserInfo(statusData.user_info);
      }

      if (!statusData.connected) {
        alert('No hay conexión con MercadoLibre');
        return;
      }

      // Obtener publicaciones MAPEADAS para Tienda Nube
      console.log('[ML] Solicitando items-for-tiendanube...');
      const itemsResponse = await fetch('/api/mercadolibre/items-for-tiendanube?limit=50&status=active');
      const itemsData = await itemsResponse.json();
      
      console.log('[ML] Respuesta completa del servidor:', itemsData);

      if (itemsData.success) {
        const mappedItems = itemsData.data.items || [];
        const originalItems = itemsData.data.original_items || [];
        
        console.log('[ML] Mapped items extraídos:', mappedItems);
        console.log('[ML] Original items extraídos:', originalItems);
        console.log('[ML] Cantidad mapped:', mappedItems.length);
        console.log('[ML] Cantidad original:', originalItems.length);
        
        setMlMappedItems(mappedItems);
        setMlItems(originalItems);
        
        console.log(`[ML] Estado actualizado - mlMappedItems tendrá ${mappedItems.length} items`);
        
        alert(`✅ ${mappedItems.length} publicaciones cargadas y mapeadas para Tienda Nube`);
      } else {
        console.error('[ML] Error en respuesta:', itemsData);
        alert('Error al cargar publicaciones: ' + (itemsData.message || 'Error desconocido'));
      }
    } catch (error) {
      console.error('Error loading ML items:', error);
      alert('Error al cargar publicaciones de MercadoLibre');
    } finally {
      setLoadingMlItems(false);
    }
  };

  const handleSelectMlItem = (mlId) => {
    setSelectedMlItems(prev => {
      if (prev.includes(mlId)) {
        return prev.filter(id => id !== mlId);
      } else {
        return [...prev, mlId];
      }
    });
  };

  const handleSelectAllMlItems = () => {
    if (selectedMlItems.length === mlMappedItems.length) {
      setSelectedMlItems([]);
    } else {
      setSelectedMlItems(mlMappedItems.map(item => item.ml_id));
    }
  };

  const handleMigrateToTiendaNube = async () => {
    if (selectedMlItems.length === 0) {
      alert('Por favor selecciona al menos un producto para migrar');
      return;
    }

    const confirm = window.confirm(
      `¿Estás seguro de migrar ${selectedMlItems.length} productos a Tienda Nube?\n\n` +
      'Esto creará nuevos productos en tu tienda.'
    );

    if (!confirm) return;

    setMigratingToTN(true);
    const results = { total: selectedMlItems.length, created: 0, errors: [] };

    try {
      for (const mlId of selectedMlItems) {
        const mappedItem = mlMappedItems.find(item => item.ml_id === mlId);
        
        if (!mappedItem) continue;

        try {
          // Crear producto en Tienda Nube
          const response = await fetch('/api/tiendanube/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mappedItem),
          });

          const data = await response.json();

          if (data.success) {
            results.created++;
            console.log(`[TN] Producto creado: ${mappedItem.name.es}`, data.data);
          } else {
            throw new Error(data.message || 'Error desconocido');
          }
        } catch (error) {
          results.errors.push({
            ml_id: mlId,
            name: mappedItem.name.es,
            error: error.message
          });
          console.error(`[TN] Error creando ${mappedItem.name.es}:`, error);
        }
      }

      setMigrationResults(results);
      
      const message = `✅ Migración completada!\n\n` +
        `Total: ${results.total}\n` +
        `Creados: ${results.created}\n` +
        `Errores: ${results.errors.length}`;
      
      alert(message);
      
      // Limpiar selección
      setSelectedMlItems([]);
      
    } catch (error) {
      console.error('Error en migración:', error);
      alert('Error durante la migración');
    } finally {
      setMigratingToTN(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Store sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#333' }}>
            Tienda Nube - API
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Integración con la plataforma de e-commerce Tienda Nube
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Configuración" icon={<Settings />} iconPosition="start" />
          <Tab label="Endpoints" icon={<Api />} iconPosition="start" />
          <Tab label="Agregar Producto" icon={<Inventory />} iconPosition="start" />
          <Tab label="Sincronizar Stock" icon={<CloudSync />} iconPosition="start" />
          <Tab label="MercadoLibre" icon={<ShoppingCart />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab: Configuración */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Selector de Cuentas */}
          <Grid item xs={12}>
            <AccountSelector onAccountChange={(account) => {
              console.log('Cuenta cambiada:', account);
              checkConnection();
            }} />
          </Grid>

          {/* Estado de Conexión */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <CloudSync sx={{ fontSize: 32, color: '#1976d2' }} />
                  <Typography variant="h6">Estado de Conexión</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                {isConnected ? (
                  <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                    Conectado a Tienda Nube
                  </Alert>
                ) : (
                  <Alert severity="warning" icon={<Error />} sx={{ mb: 2 }}>
                    No conectado
                  </Alert>
                )}

                {connectionStatus && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Mensaje:</strong> {connectionStatus.message}
                    </Typography>
                    {connectionStatus.token_obtained_at && (
                      <Typography variant="body2" color="text.secondary">
                        <strong>Token obtenido:</strong> {new Date(connectionStatus.token_obtained_at).toLocaleString()}
                      </Typography>
                    )}
                    {connectionStatus.scopes && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Permisos:</strong>
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(() => {
                            const scopesArray = Array.isArray(connectionStatus.scopes) 
                              ? connectionStatus.scopes 
                              : connectionStatus.scopes.split(',').map(s => s.trim());
                            return (
                              <>
                                {scopesArray.slice(0, 6).map((scope, index) => (
                                  <Chip key={index} label={scope} size="small" />
                                ))}
                                {scopesArray.length > 6 && (
                                  <Chip label={`+${scopesArray.length - 6} más`} size="small" />
                                )}
                              </>
                            );
                          })()}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleGetAuthUrl}
                    disabled={loading}
                    startIcon={<LinkIcon />}
                  >
                    Obtener URL de Autenticación
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleTestConnection}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <CloudSync />}
                  >
                    Probar Conexión
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Información de la Tienda */}
          {storeInfo && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Store sx={{ fontSize: 32, color: '#1976d2' }} />
                    <Typography variant="h6">Información de la Tienda</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="body2">
                      <strong>Nombre:</strong> {storeInfo.name?.es || storeInfo.name || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>URL:</strong> {storeInfo.url || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {storeInfo.email || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>País:</strong> {storeInfo.country?.es || storeInfo.country || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Moneda:</strong> {storeInfo.currency || 'N/A'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Credenciales */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Settings sx={{ fontSize: 32, color: '#1976d2' }} />
                  <Typography variant="h6">Credenciales de API</Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  Las credenciales están configuradas en el backend. Para cambiarlas, edita el archivo de configuración.
                </Alert>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Client ID"
                      value="17976"
                      disabled
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Store ID"
                      value="6256320"
                      disabled
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="API Base URL"
                      value="https://api.tiendanube.com/v1"
                      disabled
                      size="small"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab: Endpoints */}
      {tabValue === 1 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Estos son todos los endpoints disponibles en la API de Tienda Nube. Puedes usarlos para integrar tu tienda con el sistema.
          </Alert>

          {endpoints.map((category, categoryIndex) => (
            <Accordion key={categoryIndex} defaultExpanded={categoryIndex === 0}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {category.category}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {category.items.map((endpoint, endpointIndex) => (
                    <React.Fragment key={endpointIndex}>
                      <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', mb: 1 }}>
                          <ListItemIcon sx={{ minWidth: 'auto' }}>
                            {getIcon(endpoint.iconName)}
                          </ListItemIcon>
                          <Chip
                            label={endpoint.method}
                            size="small"
                            sx={{
                              backgroundColor: getMethodColor(endpoint.method),
                              color: 'white',
                              fontWeight: 700,
                              minWidth: 60,
                            }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              backgroundColor: '#f5f5f5',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              flex: 1,
                            }}
                          >
                            {endpoint.path}
                          </Typography>
                        </Box>
                        <ListItemText
                          primary={endpoint.description}
                          secondary={endpoint.params && `Parámetros: ${endpoint.params}`}
                          sx={{ ml: 6 }}
                        />
                      </ListItem>
                      {endpointIndex < category.items.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Tab: Agregar Producto */}
      {tabValue === 2 && (
        <Box>
          {/* Carga Masiva */}
          <BulkProductUpload />

          {/* Agregar Producto Individual */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Inventory /> Agregar Producto Individual
              </Typography>
              <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre del Producto *"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Ej: Filtro de Aceite"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SKU / Código"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  placeholder="Ej: FLT-001"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Descripción"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Descripción detallada del producto..."
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Precio *"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="0.00"
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Stock Inicial"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  placeholder="0"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleCreateProduct}
                  disabled={uploadingProduct || !newProduct.name || !newProduct.price}
                  startIcon={uploadingProduct ? <CircularProgress size={20} /> : <CloudSync />}
                  sx={{ height: '56px' }}
                >
                  {uploadingProduct ? 'Creando...' : 'Crear Producto'}
                </Button>
              </Grid>
            </Grid>

            {productResult && (
              <Box sx={{ mt: 3 }}>
                {productResult.success ? (
                  <Alert severity="success">
                    <Typography variant="body2">
                      <strong>¡Producto creado exitosamente!</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      ID: {productResult.product?.id} | Nombre: {productResult.product?.name?.es}
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="error">
                    <Typography variant="body2">
                      <strong>Error al crear producto:</strong> {productResult.error}
                    </Typography>
                  </Alert>
                )}
              </Box>
            )}

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Nota:</strong> Los campos marcados con * son obligatorios. El producto se creará como publicado por defecto.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
        </Box>
      )}

      {/* Tab: Sincronizar Stock */}
      {tabValue === 3 && (
        <Box>
          {/* Exportar/Importar Masivo */}
          <BulkStockUpdate />

          {/* Sincronización Individual */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudSync /> Sincronizar Stock y Precios (Individual)
              </Typography>
              <Divider sx={{ mb: 3 }} />

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Carga los productos desde Tienda Nube, edita los precios y stock que desees actualizar, y luego haz clic en "Actualizar Productos".
              </Typography>
            </Alert>

            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleLoadProducts}
                disabled={loadingProducts}
                startIcon={loadingProducts ? <CircularProgress size={20} /> : <CloudSync />}
                fullWidth
              >
                {loadingProducts ? 'Cargando...' : 'Cargar Productos desde Tienda Nube'}
              </Button>
              
              {tiendaNubeProducts.length > 0 && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleUpdateProducts}
                  disabled={updatingProducts || Object.keys(editedProducts).length === 0}
                  startIcon={updatingProducts ? <CircularProgress size={20} /> : <CloudSync />}
                  fullWidth
                >
                  {updatingProducts ? 'Actualizando...' : `Actualizar ${Object.keys(editedProducts).filter(id => Object.keys(editedProducts[id]).length > 0).length} Productos`}
                </Button>
              )}
            </Box>

            {tiendaNubeProducts.length > 0 && (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>{tiendaNubeProducts.length} productos</strong> cargados. Edita los campos que desees actualizar.
                  </Typography>
                </Alert>

                <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>Nombre</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>SKU</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', width: 150 }}>Precio Regular</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', width: 150 }}>Precio Promocional</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5', width: 120 }}>Stock</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tiendaNubeProducts.map((product) => (
                        <TableRow 
                          key={product.id}
                          sx={{
                            backgroundColor: editedProducts[product.id] ? '#fff3e0' : 'inherit',
                          }}
                        >
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{product.sku || '-'}</TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              defaultValue={product.price}
                              onChange={(e) => handleEditProduct(product.id, 'price', e.target.value)}
                              InputProps={{
                                startAdornment: <Typography sx={{ mr: 0.5, fontSize: '0.875rem' }}>$</Typography>,
                              }}
                              sx={{
                                '& .MuiInputBase-input': { 
                                  padding: '6px 8px',
                                  fontSize: '0.875rem',
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              defaultValue={product.promotional_price}
                              onChange={(e) => handleEditProduct(product.id, 'promotional_price', e.target.value)}
                              placeholder="Sin promoción"
                              InputProps={{
                                startAdornment: <Typography sx={{ mr: 0.5, fontSize: '0.875rem' }}>$</Typography>,
                              }}
                              sx={{
                                '& .MuiInputBase-input': { 
                                  padding: '6px 8px',
                                  fontSize: '0.875rem',
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              defaultValue={product.stock}
                              onChange={(e) => handleEditProduct(product.id, 'stock', e.target.value)}
                              sx={{
                                '& .MuiInputBase-input': { 
                                  padding: '6px 8px',
                                  fontSize: '0.875rem',
                                },
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                  💡 Los productos con fondo naranja tienen cambios pendientes
                </Typography>
              </Box>
            )}

            {updateResults && (
              <Box sx={{ mt: 3 }}>
                <Alert severity={updateResults.errors.length === 0 ? 'success' : 'warning'}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Resultados de la actualización:</strong>
                  </Typography>
                  <Typography variant="body2">
                    • Total procesados: {updateResults.total}
                  </Typography>
                  <Typography variant="body2">
                    • Actualizados exitosamente: {updateResults.updated}
                  </Typography>
                  <Typography variant="body2">
                    • Errores: {updateResults.errors.length}
                  </Typography>
                </Alert>

                {updateResults.errors.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="error" gutterBottom>
                      <strong>Productos con errores:</strong>
                    </Typography>
                    <TableContainer component={Paper} sx={{ maxHeight: 200 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Producto</strong></TableCell>
                            <TableCell><strong>Error</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {updateResults.errors.map((error, index) => (
                            <TableRow key={index}>
                              <TableCell>{error.name}</TableCell>
                              <TableCell>{error.error}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
        </Box>
      )}

      {/* Tab: MercadoLibre */}
      {tabValue === 4 && (
        <Card>
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h5" gutterBottom>
                    Publicaciones de MercadoLibre
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Obtén hasta 50 publicaciones activas con todos sus datos
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleVerifyMlConnection}
                    disabled={verifyingMlConnection}
                    startIcon={verifyingMlConnection ? <CircularProgress size={20} /> : <CheckCircle />}
                  >
                    {verifyingMlConnection ? 'Verificando...' : 'Verificar Conexión'}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleLoadMlItems}
                    disabled={loadingMlItems}
                    startIcon={loadingMlItems ? <CircularProgress size={20} /> : <ShoppingCart />}
                  >
                    {loadingMlItems ? 'Cargando...' : 'Cargar Publicaciones'}
                  </Button>
                </Box>
              </Box>

              {/* Estado de conexión */}
              {mlConnectionStatus && (
                <Alert 
                  severity={mlConnectionStatus.connected ? 'success' : 'error'} 
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2">
                    <strong>Estado:</strong> {mlConnectionStatus.message}
                  </Typography>
                  {mlConnectionStatus.token_renewed && (
                    <Typography variant="body2" sx={{ mt: 1, color: 'success.dark' }}>
                      🔄 Token renovado automáticamente
                    </Typography>
                  )}
                  {mlConnectionStatus.expires_at && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Expira: {new Date(mlConnectionStatus.expires_at).toLocaleString('es-AR')}
                    </Typography>
                  )}
                </Alert>
              )}
            </Box>

            {/* Estado de conexión ML */}
            {mlUserInfo && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Usuario:</strong> {mlUserInfo.nickname} ({mlUserInfo.id})
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {mlUserInfo.email}
                </Typography>
              </Alert>
            )}

            {/* Tabla de publicaciones con checkboxes para migrar */}
            {mlMappedItems.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 3 }}>
                  <Typography variant="h6">
                    📦 Productos para Migrar ({selectedMlItems.length} de {mlMappedItems.length} seleccionados)
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleSelectAllMlItems}
                    >
                      {selectedMlItems.length === mlMappedItems.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleMigrateToTiendaNube}
                      disabled={migratingToTN || selectedMlItems.length === 0}
                      startIcon={migratingToTN ? <CircularProgress size={20} /> : <CloudSync />}
                      size="large"
                    >
                      {migratingToTN ? 'Migrando...' : `🚀 Migrar ${selectedMlItems.length} a Tienda Nube`}
                    </Button>
                  </Box>
                </Box>

                <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedMlItems.length === mlMappedItems.length && mlMappedItems.length > 0}
                            indeterminate={selectedMlItems.length > 0 && selectedMlItems.length < mlMappedItems.length}
                            onChange={handleSelectAllMlItems}
                          />
                        </TableCell>
                        <TableCell><strong>ML ID</strong></TableCell>
                        <TableCell><strong>Nombre</strong></TableCell>
                        <TableCell><strong>Precio</strong></TableCell>
                        <TableCell><strong>Precio Promo</strong></TableCell>
                        <TableCell><strong>Stock</strong></TableCell>
                        <TableCell><strong>SKU</strong></TableCell>
                        <TableCell><strong>Peso (kg)</strong></TableCell>
                        <TableCell><strong>Dimensiones (cm)</strong></TableCell>
                        <TableCell><strong>Imágenes</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {mlMappedItems.map((item) => (
                        <TableRow 
                          key={item.ml_id}
                          hover
                          selected={selectedMlItems.includes(item.ml_id)}
                          sx={{ 
                            cursor: 'pointer',
                            '&.Mui-selected': {
                              backgroundColor: 'rgba(25, 118, 210, 0.08)',
                            }
                          }}
                          onClick={() => handleSelectMlItem(item.ml_id)}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedMlItems.includes(item.ml_id)}
                              onChange={() => handleSelectMlItem(item.ml_id)}
                            />
                          </TableCell>
                          <TableCell>
                            <a 
                              href={item.ml_permalink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#1976d2', textDecoration: 'none' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {item.ml_id}
                            </a>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ maxWidth: 300 }}>
                              {item.name.es}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                              ${parseFloat(item.variants[0].price).toLocaleString('es-AR')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {item.variants[0].promotional_price ? (
                              <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                                ${parseFloat(item.variants[0].promotional_price).toLocaleString('es-AR')}
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={item.variants[0].stock}
                              size="small"
                              color={item.variants[0].stock > 0 ? 'success' : 'error'}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {item.variants[0].sku}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {item.variants[0].weight || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ display: 'block' }}>
                              {item.variants[0].width && item.variants[0].height && item.variants[0].depth ? (
                                `${item.variants[0].width} × ${item.variants[0].height} × ${item.variants[0].depth}`
                              ) : (
                                '-'
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`${item.images?.length || 0} fotos`}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Resultados de migración */}
                {migrationResults && (
                  <Alert severity={migrationResults.errors.length === 0 ? 'success' : 'warning'} sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>✅ Migración completada:</strong> {migrationResults.created} de {migrationResults.total} productos creados en Tienda Nube
                    </Typography>
                    {migrationResults.errors.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" display="block"><strong>⚠️ Errores:</strong></Typography>
                        {migrationResults.errors.slice(0, 5).map((err, idx) => (
                          <Typography key={idx} variant="caption" display="block">
                            • {err.name}: {err.error}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Alert>
                )}
              </Box>
            )}

            {/* Detalles expandibles */}
            {mlItems.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Detalles de Publicaciones
                </Typography>
                {mlItems.slice(0, 5).map((item) => (
                  <Accordion key={item.id}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>{item.title}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2"><strong>ID:</strong> {item.id}</Typography>
                          <Typography variant="body2"><strong>SKU:</strong> {item.seller_custom_field || 'N/A'}</Typography>
                          <Typography variant="body2"><strong>Precio:</strong> ${item.price?.toLocaleString('es-AR')}</Typography>
                          <Typography variant="body2"><strong>Stock:</strong> {item.available_quantity}</Typography>
                          <Typography variant="body2"><strong>Vendidos:</strong> {item.sold_quantity}</Typography>
                          <Typography variant="body2"><strong>Condición:</strong> {item.condition}</Typography>
                          <Typography variant="body2"><strong>Estado:</strong> {item.status}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2"><strong>Categoría:</strong> {item.category_id}</Typography>
                          <Typography variant="body2"><strong>Tipo de listado:</strong> {item.listing_type_id}</Typography>
                          <Typography variant="body2"><strong>Garantía:</strong> {item.warranty || 'Sin garantía'}</Typography>
                          <Typography variant="body2"><strong>Envío gratis:</strong> {item.shipping?.free_shipping ? 'Sí' : 'No'}</Typography>
                          <Typography variant="body2"><strong>Modo:</strong> {item.shipping?.mode || 'N/A'}</Typography>
                          {item.permalink && (
                            <Typography variant="body2">
                              <strong>Link:</strong>{' '}
                              <a href={item.permalink} target="_blank" rel="noopener noreferrer">
                                Ver publicación
                              </a>
                            </Typography>
                          )}
                        </Grid>
                        {item.pictures && item.pictures.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="body2" gutterBottom><strong>Imágenes:</strong></Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {item.pictures.slice(0, 3).map((pic, idx) => (
                                <img 
                                  key={idx}
                                  src={pic.secure_url || pic.url} 
                                  alt={`Imagen ${idx + 1}`}
                                  style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 4 }}
                                />
                              ))}
                            </Box>
                          </Grid>
                        )}
                        {item.attributes && item.attributes.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="body2" gutterBottom><strong>Atributos:</strong></Typography>
                            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                              {item.attributes.map((attr, idx) => (
                                <Typography key={idx} variant="caption" display="block">
                                  • {attr.name}: {attr.value_name || attr.value_struct?.number || 'N/A'}
                                </Typography>
                              ))}
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}

            {mlMappedItems.length === 0 && !loadingMlItems && (
              <Alert severity="info">
                Haz clic en "Cargar Publicaciones" para obtener tus publicaciones de MercadoLibre
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default TiendaNubeAPI;
