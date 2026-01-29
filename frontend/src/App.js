import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Administracion from './components/Administracion';
import ListarUsuarios from './components/ListarUsuarios';
import CrearUsuario from './components/CrearUsuario';
import GestionRoles from './components/GestionRoles';
import CambiarContrasena from './components/CambiarContrasena';
import CatalogoProductos from './components/CatalogoProductos';
import CrearCliente from './components/CrearCliente';
import ListarClientes from './components/ListarClientes';
import Almacenes from './components/Almacenes';
import IngresoAlmacenNuevo from './components/IngresoAlmacenNuevo';
import EgresoAlmacenNuevo from './components/EgresoAlmacenNuevo';
import Transferencias from './components/Transferencias';
import InventarioAlmacen from './components/InventarioAlmacen';

// Componente para rutas privadas
const PrivateRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/administracion" 
          element={
            <PrivateRoute>
              <Administracion />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/administracion/usuarios" 
          element={
            <PrivateRoute>
              <ListarUsuarios />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/administracion/usuarios/crear" 
          element={
            <PrivateRoute>
              <CrearUsuario />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/administracion/roles" 
          element={
            <PrivateRoute>
              <GestionRoles />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/administracion/cambiar-contrasena" 
          element={
            <PrivateRoute>
              <CambiarContrasena />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/cambiar-contrasena/:id" 
          element={
            <PrivateRoute>
              <CambiarContrasena />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/catalogo-productos" 
          element={
            <PrivateRoute>
              <CatalogoProductos />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/crear-cliente" 
          element={
            <PrivateRoute>
              <CrearCliente />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/listar-clientes" 
          element={
            <PrivateRoute>
              <ListarClientes />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/almacenes" 
          element={
            <PrivateRoute>
              <Almacenes />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/almacenes/:almacen/ingreso" 
          element={
            <PrivateRoute>
              <IngresoAlmacenNuevo />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/almacenes/:almacen/egreso" 
          element={
            <PrivateRoute>
              <EgresoAlmacenNuevo />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/almacenes/:almacen/transferencias" 
          element={
            <PrivateRoute>
              <Transferencias />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/almacenes/:almacen/inventario" 
          element={
            <PrivateRoute>
              <InventarioAlmacen />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/" 
          element={<Navigate to="/dashboard" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
