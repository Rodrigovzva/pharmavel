import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, waitForRehydration } from './store/authStore';
import LoginPage from './pages/LoginPage';
import { Box, CircularProgress, Typography } from '@mui/material';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import ClientesPage from './pages/ClientesPage';
import ProductosPage from './pages/ProductosPage';
import AlmacenesPage from './pages/AlmacenesPage';
import VentasPage from './pages/VentasPage';
import CuentasCobrarPage from './pages/CuentasCobrarPage';
import AdministracionPage from './pages/AdministracionPage';
import TrazabilidadPage from './pages/TrazabilidadPage';
import ReportesPage from './pages/ReportesPage';
import InventarioPage from './pages/InventarioPage';
import IngresosPage from './pages/IngresosPage';
import ProveedoresPage from './pages/ProveedoresPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    waitForRehydration().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
        <CircularProgress />
        <Typography color="text.secondary">Cargando...</Typography>
      </Box>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="almacenes" element={<AlmacenesPage />} />
        <Route path="inventario" element={<InventarioPage />} />
        <Route path="ingresos" element={<IngresosPage />} />
        <Route path="proveedores" element={<ProveedoresPage />} />
        <Route path="ventas" element={<VentasPage />} />
        <Route path="cuentas-cobrar" element={<CuentasCobrarPage />} />
        <Route path="administracion" element={<AdministracionPage />} />
        <Route path="trazabilidad" element={<TrazabilidadPage />} />
        <Route path="reportes" element={<ReportesPage />} />
      </Route>
    </Routes>
  );
}

export default App;
