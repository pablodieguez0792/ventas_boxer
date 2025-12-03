import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Switch,
  FormControlLabel,
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
  InputAdornment,
  CardMedia,
  CardActions,
  Divider,
  Avatar,
  Badge,
  Stack,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  Business,
  Settings,
  CheckCircle,
  Error,
  CloudSync,
  Search,
  DirectionsCar,
  Build,
  ExpandMore,
  Api,
  Article,
  PhotoLibrary,
  LocalShipping,
  Engineering,
  Info,
  Category,
  Code,
  Inventory,
  VerifiedUser,
  ShoppingCart,
  ArrowBackIos,
  ArrowForwardIos,
  FiberManualRecord,
} from "@mui/icons-material";

const PromotiveAPI = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState("8e4aa28708151c851ddceb70bd5cc8be");
  const [clientSecret, setClientSecret] = useState(
    "45bd24d82eba8b8194d2c7fff2db027eb006768fc8241c2810f51daa716f8895"
  );
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  // Estados para búsqueda de vehículos
  const [searchType, setSearchType] = useState("plate"); // 'plate' o 'vin'
  const [searchValue, setSearchValue] = useState("");
  const [vehicleData, setVehicleData] = useState(null);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [includePartes, setIncludePartes] = useState(false);

  // Estados para búsqueda de artículos
  const [searchTerm, setSearchTerm] = useState("");
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState({});

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch("/api/promotive/status");
      const data = await response.json();
      setConnectionStatus(data);
      setIsConnected(data.connected && data.token_valid);
    } catch (error) {
      console.error("Error checking status:", error);
    }
  };

  const handleConnect = async () => {
    if (!clientId || !clientSecret) {
      alert("Por favor ingresa Client ID y Client Secret");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/promotive/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsConnected(true);
        setConnectionStatus(data.data);
        alert("Conexión exitosa con Promotive");
      } else {
        alert("Error de conexión: " + data.message);
      }
    } catch (error) {
      console.error("Error connecting:", error);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleSearch = async () => {
    if (!searchValue.trim()) {
      alert("Por favor ingresa una patente o VIN");
      return;
    }

    setLoadingVehicle(true);
    setVehicleData(null);

    try {
      const params = new URLSearchParams({
        [searchType]: searchValue.trim(),
        include_parts: includePartes,
      });

      const response = await fetch(`/api/promotive/vehicle/complete?${params}`);
      const data = await response.json();

      if (data.success) {
        setVehicleData(data.data);
      } else {
        alert("Vehículo no encontrado: " + data.message);
      }
    } catch (error) {
      console.error("Error searching vehicle:", error);
      alert("Error en la búsqueda");
    } finally {
      setLoadingVehicle(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Funciones para el carrusel de imágenes
  const nextImage = (articleIndex, totalImages) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [articleIndex]:
        prev[articleIndex] !== undefined
          ? (prev[articleIndex] + 1) % totalImages
          : 1,
    }));
  };

  const prevImage = (articleIndex, totalImages) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [articleIndex]:
        prev[articleIndex] !== undefined
          ? (prev[articleIndex] - 1 + totalImages) % totalImages
          : totalImages - 1,
    }));
  };

  const goToImage = (articleIndex, imageIndex) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [articleIndex]: imageIndex,
    }));
  };

  const handleSearchArticles = async () => {
    setLoadingArticles(true);
    setArticles([]);

    try {
      const params = new URLSearchParams({
        page: 1,
        limit: 100,
      });
      // Si hay término de búsqueda, agregarlo
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const response = await fetch(`/api/promotive/search/parts?${params}`);
      const data = await response.json();

      if (data.success) {
        setArticles(data.data);
      } else {
        alert("Error en la búsqueda: " + data.message);
      }
    } catch (error) {
      console.error("Error searching articles:", error);
      alert("Error en la búsqueda");
    } finally {
      setLoadingArticles(false);
    }
  };

  // Endpoints disponibles
  const endpoints = [
    {
      name: "Login",
      path: "/api/promotive/login",
      method: "POST",
      status: "active",
      description: "Autenticación OAuth con SpecParts",
    },
    {
      name: "Status",
      path: "/api/promotive/status",
      method: "GET",
      status: "active",
      description: "Estado de conexión y token",
    },
    {
      name: "Vehicle Identify",
      path: "/api/promotive/vehicle/identify",
      method: "GET",
      status: "active",
      description: "Identificación por patente/VIN",
    },
    {
      name: "Vehicle Complete",
      path: "/api/promotive/vehicle/complete",
      method: "GET",
      status: "active",
      description: "Información completa del vehículo",
    },
    {
      name: "Parts",
      path: "/api/promotive/parts",
      method: "GET",
      status: "active",
      description: "Partes compatibles por vehículo",
    },
    {
      name: "Search Parts",
      path: "/api/promotive/search/parts",
      method: "GET",
      status: "active",
      description: "Búsqueda de partes por término",
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Business sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Promotive / SpecParts
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            API para consulta de vehículos por patente/VIN y búsqueda de partes
          </Typography>
        </Box>
      </Box>

      {/* Conexión y Credenciales */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Settings sx={{ mr: 1 }} />
            <Typography variant="h6">Configuración de Conexión</Typography>
          </Box>

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Client ID"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                margin="normal"
                variant="outlined"
                disabled
                helperText="Credenciales precargadas para SpecParts API"
              />
              <TextField
                fullWidth
                label="Client Secret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                margin="normal"
                variant="outlined"
                disabled
                helperText="Configuración automática"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleConnect}
                disabled={loading || !clientId || !clientSecret}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <CloudSync />
                }
                size="large"
                sx={{ mt: 2, height: "fit-content", minHeight: "56px" }}
              >
                {loading
                  ? "Conectando..."
                  : isConnected
                  ? "Conectado ✓"
                  : "Conectar a SpecParts"}
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Chip
                  icon={isConnected ? <CheckCircle /> : <Error />}
                  label={isConnected ? "Conectado" : "Desconectado"}
                  color={isConnected ? "success" : "error"}
                  size="small"
                  sx={{ mr: 2 }}
                />
                {connectionStatus && connectionStatus.token_expires_at && (
                  <Typography variant="body2" color="text.secondary">
                    Token expira:{" "}
                    {new Date(
                      connectionStatus.token_expires_at
                    ).toLocaleString()}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Pestañas principales */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<Api />} label="Endpoints" iconPosition="start" />
          <Tab
            icon={<DirectionsCar />}
            label="Patente / Chasis"
            iconPosition="start"
          />
          <Tab icon={<Article />} label="Artículos" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab 0: Endpoints */}
      {tabValue === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Endpoints Disponibles
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Método</TableCell>
                  <TableCell>Ruta</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Descripción</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {endpoints.map((endpoint, index) => (
                  <TableRow key={index}>
                    <TableCell>{endpoint.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={endpoint.method}
                        color={
                          endpoint.method === "GET" ? "primary" : "secondary"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell
                      sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                    >
                      {endpoint.path}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={endpoint.status}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{endpoint.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Tab 1: Patente / Chasis */}
      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Consulta de Vehículos por Patente/VIN
          </Typography>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={2}>
                  <TextField
                    select
                    fullWidth
                    label="Tipo"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    SelectProps={{ native: true }}
                    size="small"
                  >
                    <option value="plate">Patente</option>
                    <option value="vin">VIN</option>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label={searchType === "plate" ? "Patente" : "VIN"}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={
                      searchType === "plate" ? "AB123CD" : "1HGBH41JXMN109186"
                    }
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={includePartes}
                        onChange={(e) => setIncludePartes(e.target.checked)}
                      />
                    }
                    label="Incluir partes compatibles"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleVehicleSearch}
                    disabled={loadingVehicle || !isConnected}
                    startIcon={
                      loadingVehicle ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Search />
                      )
                    }
                  >
                    {loadingVehicle ? "Buscando..." : "Buscar Vehículo"}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Resultados de la búsqueda */}
          {vehicleData && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Información del Vehículo
              </Typography>

              {/* Información básica */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1">Datos Básicos</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Marca:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.brand || "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Modelo:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.model ||
                          vehicleData.basic_info?.master_model ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Versión:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.version || "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Año:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.reference_year ||
                          vehicleData.basic_info?.year ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Motor:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.engine_displacement_liters
                          ? `${vehicleData.basic_info.engine_displacement_liters}L`
                          : vehicleData.basic_info?.engine ||
                            vehicleData.basic_info?.motor ||
                            "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Código Motor:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.engine_code || "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Combustible:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.fuel_type || "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        VIN/Chasis:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.vin ||
                          vehicleData.basic_info?.chassis ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Segmento:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.segment ||
                          vehicleData.basic_info?.grouped_segment ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Código del Vehículo:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.code ||
                          vehicleData.basic_info?.vehicle_code ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Años de Venta:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.sold_from_year
                          ? `${vehicleData.basic_info.sold_from_year}${
                              vehicleData.basic_info.sold_until_year
                                ? ` - ${vehicleData.basic_info.sold_until_year}`
                                : " - Presente"
                            }`
                          : "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Familia Motor:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.engine_family ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Transmisión:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.transmision ||
                          vehicleData.basic_info?.transmission ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Tracción:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.traccion ||
                          vehicleData.basic_info?.drive ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Familia:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.familia ||
                          vehicleData.basic_info?.family ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Distribución:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.distribucion ||
                          vehicleData.basic_info?.distribution ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Turbo:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.turbo ? "Sí" : "No"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Pasos de Caja:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.pasos_caja ||
                          vehicleData.basic_info?.gears ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Frenos Delanteros:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.frenos_del ||
                          vehicleData.basic_info?.front_brakes ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Frenos Traseros:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.frenos_tras ||
                          vehicleData.basic_info?.rear_brakes ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Dirección:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.direccion ||
                          vehicleData.basic_info?.steering ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Suspensión Delantera:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.suspension_del ||
                          vehicleData.basic_info?.front_suspension ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Suspensión Trasera:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.suspension_tras ||
                          vehicleData.basic_info?.rear_suspension ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Neumáticos:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.neumaticos ||
                          vehicleData.basic_info?.tires ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Llantas:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.llantas ||
                          vehicleData.basic_info?.wheels ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Peso:
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.pesos ||
                          vehicleData.basic_info?.weight ||
                          "No disponible"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Años de venta
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.sold_from_year || "N/A"} -{" "}
                        {vehicleData.basic_info?.sold_until_year || "N/A"}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        Kilometraje
                      </Typography>
                      <Typography variant="body1">
                        {vehicleData.basic_info?.mileage || "No disponible"}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>

              {/* Información técnica detallada */}
              {vehicleData.technical_details && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="h6">
                      Información técnica adicional del vehículo
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {/* Mostrar solo información relevante y legible */}
                      {vehicleData.technical_details.market_name && (
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            Mercado:
                          </Typography>
                          <Typography variant="body1">
                            {vehicleData.technical_details.market_name}
                          </Typography>
                        </Grid>
                      )}

                      {vehicleData.technical_details.vehicle_ids &&
                        vehicleData.technical_details.vehicle_ids.length >
                          0 && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary">
                              Vehículos compatibles:
                            </Typography>
                            <Typography variant="body1">
                              {vehicleData.technical_details.vehicle_ids.length}{" "}
                              modelos encontrados
                            </Typography>
                          </Grid>
                        )}

                      {/* Mostrar otros campos relevantes si existen */}
                      {Object.entries(vehicleData.technical_details).map(
                        ([key, value]) => {
                          // Filtrar campos que no queremos mostrar o que ya mostramos
                          if (
                            key === "vehicle_ids" ||
                            key === "market_id" ||
                            key === "market_name"
                          )
                            return null;

                          // Solo mostrar valores que no sean arrays largos o objetos complejos
                          if (Array.isArray(value) && value.length > 10)
                            return null;
                          if (typeof value === "object" && value !== null)
                            return null;

                          return (
                            <Grid item xs={12} sm={6} key={key}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {key
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())}
                                :
                              </Typography>
                              <Typography variant="body1">
                                {String(value)}
                              </Typography>
                            </Grid>
                          );
                        }
                      )}

                      {/* Si no hay información útil, mostrar mensaje */}
                      {!vehicleData.technical_details.market_name &&
                        !vehicleData.technical_details.vehicle_ids &&
                        Object.keys(vehicleData.technical_details).length <=
                          2 && (
                          <Grid item xs={12}>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              style={{ fontStyle: "italic" }}
                            >
                              No hay información técnica adicional disponible
                              para este vehículo.
                            </Typography>
                          </Grid>
                        )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}

              {/* Partes compatibles */}
              {vehicleData.compatible_parts &&
                vehicleData.compatible_parts.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="subtitle1">
                        Partes Compatibles (
                        {vehicleData.compatible_parts.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper} elevation={0}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Categoría</TableCell>
                              <TableCell>Producto</TableCell>
                              <TableCell>Marca</TableCell>
                              <TableCell>Código</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {vehicleData.compatible_parts
                              .slice(0, 10)
                              .map((part, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    {part.category || "N/A"}
                                  </TableCell>
                                  <TableCell>{part.product || "N/A"}</TableCell>
                                  <TableCell>{part.brand || "N/A"}</TableCell>
                                  <TableCell>{part.code || "N/A"}</TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                      {vehicleData.compatible_parts.length > 10 && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1 }}
                        >
                          Mostrando 10 de {vehicleData.compatible_parts.length}{" "}
                          partes
                        </Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                )}
            </Box>
          )}
        </Box>
      )}

      {/* Tab 2: Artículos */}
      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Búsqueda de Artículos/Partes
          </Typography>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Término de búsqueda"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Ej: filtro aceite, pastillas freno, bomba agua"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSearchArticles}
                    disabled={loadingArticles || !isConnected}
                    startIcon={
                      loadingArticles ? (
                        <CircularProgress size={20} />
                      ) : (
                        <Search />
                      )
                    }
                  >
                    {loadingArticles ? "Buscando..." : "Buscar Artículos"}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Resultados de artículos */}
          {articles.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Resultados de la Búsqueda ({articles.length} artículos)
              </Typography>

              <Grid container spacing={3}>
                {articles.slice(0, 50).map((article, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        "&:hover": {
                          boxShadow: 4,
                          transform: "translateY(-2px)",
                          transition: "all 0.2s ease-in-out",
                        },
                      }}
                    >
                      {/* Carrusel de imágenes */}
                      {article.pictures && article.pictures.length > 0 && (
                        <Box
                          sx={{
                            position: "relative",
                            height: 200,
                            backgroundColor: "#f5f5f5",
                          }}
                        >
                          <CardMedia
                            component="img"
                            height="200"
                            image={
                              article.pictures[currentImageIndex[index] || 0]
                                ?.url || article.pictures[0].url
                            }
                            alt={article.description}
                            sx={{
                              objectFit: "contain",
                              backgroundColor: "#f5f5f5",
                              p: 1,
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />

                          {/* Controles del carrusel si hay más de una imagen */}
                          {article.pictures.length > 1 && (
                            <>
                              {/* Botón anterior */}
                              <IconButton
                                onClick={() =>
                                  prevImage(index, article.pictures.length)
                                }
                                sx={{
                                  position: "absolute",
                                  left: 8,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                                  color: "primary.main",
                                  "&:hover": {
                                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                                  },
                                  boxShadow: 1,
                                  width: 36,
                                  height: 36,
                                }}
                              >
                                <ArrowBackIos sx={{ fontSize: 16 }} />
                              </IconButton>

                              {/* Botón siguiente */}
                              <IconButton
                                onClick={() =>
                                  nextImage(index, article.pictures.length)
                                }
                                sx={{
                                  position: "absolute",
                                  right: 8,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                                  color: "primary.main",
                                  "&:hover": {
                                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                                  },
                                  boxShadow: 1,
                                  width: 36,
                                  height: 36,
                                }}
                              >
                                <ArrowForwardIos sx={{ fontSize: 16 }} />
                              </IconButton>

                              {/* Indicadores de puntos */}
                              <Box
                                sx={{
                                  position: "absolute",
                                  bottom: 8,
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  display: "flex",
                                  gap: 0.5,
                                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                                  borderRadius: 10,
                                  p: 0.5,
                                }}
                              >
                                {article.pictures.map((_, picIndex) => (
                                  <IconButton
                                    key={picIndex}
                                    onClick={() => goToImage(index, picIndex)}
                                    sx={{
                                      p: 0.25,
                                      minWidth: "auto",
                                      width: 20,
                                      height: 20,
                                    }}
                                  >
                                    <FiberManualRecord
                                      sx={{
                                        fontSize: 8,
                                        color:
                                          (currentImageIndex[index] || 0) ===
                                          picIndex
                                            ? "white"
                                            : "rgba(255, 255, 255, 0.5)",
                                        transition: "color 0.2s",
                                      }}
                                    />
                                  </IconButton>
                                ))}
                              </Box>

                              {/* Contador de imágenes */}
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  backgroundColor: "rgba(0, 0, 0, 0.7)",
                                  color: "white",
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: "0.75rem",
                                }}
                              >
                                {(currentImageIndex[index] || 0) + 1} /{" "}
                                {article.pictures.length}
                              </Box>
                            </>
                          )}
                        </Box>
                      )}

                      <CardContent sx={{ flexGrow: 1 }}>
                        {/* Header con marca y categoría */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 2,
                          }}
                        >
                          <Chip
                            label={article.brand}
                            color="primary"
                            size="small"
                            icon={<VerifiedUser />}
                          />
                          <Chip
                            label={article.category}
                            variant="outlined"
                            size="small"
                            icon={<Category />}
                          />
                        </Box>

                        {/* Título del producto */}
                        <Typography
                          variant="h6"
                          component="h3"
                          gutterBottom
                          sx={{
                            fontWeight: "bold",
                            fontSize: "1rem",
                            lineHeight: 1.3,
                            mb: 1,
                          }}
                        >
                          {article.product}
                        </Typography>

                        {/* Código y descripción */}
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              mb: 0.5,
                            }}
                          >
                            <Code sx={{ fontSize: 16, mr: 0.5 }} />
                            <strong>Código:</strong> {article.code}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {article.description}
                          </Typography>
                        </Box>

                        {/* Características especiales */}
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ mb: 2, flexWrap: "wrap", gap: 0.5 }}
                        >
                          {article.is_kit === 1 && (
                            <Chip
                              label="Kit"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                          {article.oem === 1 && (
                            <Chip
                              label="OEM"
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          )}
                          {article.national_industry === 1 && (
                            <Chip
                              label="Industria Nacional"
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          )}
                          {article.discontinued === 1 && (
                            <Chip
                              label="Descontinuado"
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          )}
                        </Stack>

                        {/* Atributos técnicos principales */}
                        {article.attributes &&
                          article.attributes.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{ fontWeight: "bold", mb: 1 }}
                              >
                                Especificaciones:
                              </Typography>
                              {article.attributes
                                .slice(0, 3)
                                .map((attr, attrIndex) => (
                                  <Typography
                                    key={attrIndex}
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ fontSize: "0.85rem" }}
                                  >
                                    • {attr.name}: {attr.value}
                                    {attr.unit ? ` ${attr.unit}` : ""}
                                  </Typography>
                                ))}
                              {article.attributes.length > 3 && (
                                <Typography
                                  variant="body2"
                                  color="primary"
                                  sx={{
                                    fontSize: "0.85rem",
                                    fontStyle: "italic",
                                  }}
                                >
                                  +{article.attributes.length - 3}{" "}
                                  especificaciones más
                                </Typography>
                              )}
                            </Box>
                          )}

                        {/* Información de vehículos compatibles */}
                        {article.vehicles && article.vehicles.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: "bold",
                                mb: 1,
                                display: "flex",
                                alignItems: "center",
                              }}
                            >
                              <DirectionsCar sx={{ fontSize: 16, mr: 0.5 }} />
                              Compatible con {article.vehicles.length}{" "}
                              vehículo(s)
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: "0.85rem" }}
                            >
                              {article.vehicles
                                .slice(0, 2)
                                .map(
                                  (vehicle) =>
                                    `${vehicle.brand} ${vehicle.model_master} ${vehicle.displacement_in_lts}L`
                                )
                                .join(", ")}
                              {article.vehicles.length > 2 &&
                                ` y ${article.vehicles.length - 2} más...`}
                            </Typography>
                          </Box>
                        )}

                        {/* Componentes del kit (si es kit) */}
                        {article.is_kit === 1 &&
                          article.components &&
                          article.components.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  fontWeight: "bold",
                                  mb: 1,
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <Engineering sx={{ fontSize: 16, mr: 0.5 }} />
                                Incluye {article.components.length}{" "}
                                componente(s)
                              </Typography>
                              {article.components
                                .slice(0, 2)
                                .map((comp, compIndex) => (
                                  <Typography
                                    key={compIndex}
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ fontSize: "0.85rem" }}
                                  >
                                    • {comp.product}{" "}
                                    {comp.quantity && `(${comp.quantity})`}
                                  </Typography>
                                ))}
                              {article.components.length > 2 && (
                                <Typography
                                  variant="body2"
                                  color="primary"
                                  sx={{
                                    fontSize: "0.85rem",
                                    fontStyle: "italic",
                                  }}
                                >
                                  +{article.components.length - 2} componentes
                                  más
                                </Typography>
                              )}
                            </Box>
                          )}
                      </CardContent>

                      <Divider />

                      <CardActions
                        sx={{ justifyContent: "space-between", p: 2 }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {article.pictures && article.pictures.length > 1 && (
                            <Chip
                              icon={<PhotoLibrary />}
                              label={`${article.pictures.length} fotos`}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 1 }}
                            />
                          )}
                          {article.cross && article.cross.length > 0 && (
                            <Chip
                              icon={<Inventory />}
                              label={`${article.cross.length} referencias`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>

                        <Button
                          size="small"
                          onClick={() =>
                            setExpandedCards((prev) => ({
                              ...prev,
                              [index]: !prev[index],
                            }))
                          }
                          endIcon={
                            <ExpandMore
                              sx={{
                                transform: expandedCards[index]
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 0.2s",
                              }}
                            />
                          }
                        >
                          {expandedCards[index] ? "Menos" : "Más info"}
                        </Button>
                      </CardActions>

                      {/* Sección expandible con información detallada */}
                      <Collapse
                        in={expandedCards[index]}
                        timeout="auto"
                        unmountOnExit
                      >
                        <CardContent sx={{ pt: 0 }}>
                          <Divider sx={{ mb: 2 }} />

                          {/* Todas las especificaciones técnicas */}
                          {article.attributes &&
                            article.attributes.length > 0 && (
                              <Accordion sx={{ mb: 2 }}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                  <Typography variant="subtitle2">
                                    Especificaciones Técnicas Completas
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Grid container spacing={1}>
                                    {article.attributes.map(
                                      (attr, attrIndex) => (
                                        <Grid
                                          item
                                          xs={12}
                                          sm={6}
                                          key={attrIndex}
                                        >
                                          <Typography
                                            variant="body2"
                                            sx={{ fontSize: "0.85rem" }}
                                          >
                                            <strong>{attr.name}:</strong>{" "}
                                            {attr.value}
                                            {attr.unit ? ` ${attr.unit}` : ""}
                                          </Typography>
                                        </Grid>
                                      )
                                    )}
                                  </Grid>
                                </AccordionDetails>
                              </Accordion>
                            )}

                          {/* Vehículos compatibles detallado */}
                          {article.vehicles && article.vehicles.length > 0 && (
                            <Accordion sx={{ mb: 2 }}>
                              <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="subtitle2">
                                  Vehículos Compatibles (
                                  {article.vehicles.length})
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Grid container spacing={1}>
                                  {article.vehicles.map((vehicle, vIndex) => (
                                    <Grid item xs={12} sm={6} key={vIndex}>
                                      <Card variant="outlined" sx={{ p: 1 }}>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            fontWeight: "bold",
                                            fontSize: "0.85rem",
                                          }}
                                        >
                                          {vehicle.brand} {vehicle.model_master}
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                          sx={{ fontSize: "0.8rem" }}
                                        >
                                          {vehicle.displacement_in_lts}L •{" "}
                                          {vehicle.transmission} • Desde{" "}
                                          {vehicle.sold_from_year}
                                        </Typography>
                                      </Card>
                                    </Grid>
                                  ))}
                                </Grid>
                              </AccordionDetails>
                            </Accordion>
                          )}

                          {/* Referencias cruzadas */}
                          {article.cross && article.cross.length > 0 && (
                            <Accordion sx={{ mb: 2 }}>
                              <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="subtitle2">
                                  Referencias Cruzadas ({article.cross.length})
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Grid container spacing={1}>
                                  {article.cross.map((cross, crossIndex) => (
                                    <Grid
                                      item
                                      xs={12}
                                      sm={6}
                                      md={4}
                                      key={crossIndex}
                                    >
                                      <Card variant="outlined" sx={{ p: 1 }}>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            fontWeight: "bold",
                                            fontSize: "0.85rem",
                                          }}
                                        >
                                          {cross.brand}
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                          sx={{ fontSize: "0.8rem" }}
                                        >
                                          {cross.code}
                                        </Typography>
                                      </Card>
                                    </Grid>
                                  ))}
                                </Grid>
                              </AccordionDetails>
                            </Accordion>
                          )}

                          {/* Componentes detallado (para kits) */}
                          {article.is_kit === 1 &&
                            article.components &&
                            article.components.length > 0 && (
                              <Accordion sx={{ mb: 2 }}>
                                <AccordionSummary expandIcon={<ExpandMore />}>
                                  <Typography variant="subtitle2">
                                    Componentes del Kit (
                                    {article.components.length})
                                  </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                  <Grid container spacing={1}>
                                    {article.components.map(
                                      (comp, compIndex) => (
                                        <Grid item xs={12} key={compIndex}>
                                          <Card
                                            variant="outlined"
                                            sx={{ p: 1 }}
                                          >
                                            <Typography
                                              variant="body2"
                                              sx={{
                                                fontWeight: "bold",
                                                fontSize: "0.85rem",
                                              }}
                                            >
                                              {comp.product}
                                            </Typography>
                                            <Typography
                                              variant="body2"
                                              color="text.secondary"
                                              sx={{ fontSize: "0.8rem" }}
                                            >
                                              Código: {comp.code}{" "}
                                              {comp.quantity &&
                                                `• Cantidad: ${comp.quantity}`}
                                            </Typography>
                                          </Card>
                                        </Grid>
                                      )
                                    )}
                                  </Grid>
                                </AccordionDetails>
                              </Accordion>
                            )}

                          {/* Galería de imágenes */}
                          {article.pictures && article.pictures.length > 1 && (
                            <Accordion>
                              <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography variant="subtitle2">
                                  Galería de Imágenes ({article.pictures.length}
                                  )
                                </Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Grid container spacing={2}>
                                  {article.pictures.map((picture, picIndex) => (
                                    <Grid
                                      item
                                      xs={6}
                                      sm={4}
                                      md={3}
                                      key={picIndex}
                                    >
                                      <Card
                                        variant="outlined"
                                        sx={{
                                          cursor: "pointer",
                                          "&:hover": {
                                            boxShadow: 2,
                                            transform: "scale(1.02)",
                                            transition: "all 0.2s ease-in-out",
                                          },
                                          border:
                                            (currentImageIndex[index] || 0) ===
                                            picIndex
                                              ? "2px solid"
                                              : "1px solid",
                                          borderColor:
                                            (currentImageIndex[index] || 0) ===
                                            picIndex
                                              ? "primary.main"
                                              : "divider",
                                        }}
                                        onClick={() =>
                                          goToImage(index, picIndex)
                                        }
                                      >
                                        <CardMedia
                                          component="img"
                                          height="120"
                                          image={picture.url}
                                          alt={`${
                                            article.description
                                          } - Imagen ${picIndex + 1}`}
                                          sx={{
                                            objectFit: "contain",
                                            backgroundColor: "#f5f5f5",
                                          }}
                                          onError={(e) => {
                                            e.target.style.display = "none";
                                          }}
                                        />
                                        <Box
                                          sx={{
                                            position: "absolute",
                                            bottom: 4,
                                            right: 4,
                                            backgroundColor:
                                              "rgba(0, 0, 0, 0.7)",
                                            color: "white",
                                            borderRadius: 1,
                                            px: 0.5,
                                            py: 0.25,
                                            fontSize: "0.7rem",
                                          }}
                                        >
                                          {picIndex + 1}
                                        </Box>
                                      </Card>
                                    </Grid>
                                  ))}
                                </Grid>
                                <Box sx={{ mt: 2, textAlign: "center" }}>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ fontSize: "0.85rem" }}
                                  >
                                    Haz clic en cualquier imagen para verla en
                                    el carrusel principal
                                  </Typography>
                                </Box>
                              </AccordionDetails>
                            </Accordion>
                          )}
                        </CardContent>
                      </Collapse>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {articles.length > 50 && (
                <Box sx={{ mt: 3, textAlign: "center" }}>
                  <Paper sx={{ p: 2, backgroundColor: "grey.50" }}>
                    <Typography variant="body2" color="text.secondary">
                      Mostrando 50 de {articles.length} artículos encontrados
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.875rem" }}
                    >
                      Refina tu búsqueda para ver resultados más específicos
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PromotiveAPI;
