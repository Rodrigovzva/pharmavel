import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearAuth } from '../utils/auth';
import './Administracion.css';

function Administracion() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clientesMenuOpen, setClientesMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = getUser();
    if (!userData) {
      navigate('/login');
      return;
    }
    if (userData.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    setUser(userData);
  }, [navigate]);

  const handleLogout = () => {
    clearAuth();
    localStorage.clear();
    window.location.replace('/login');
  };

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const handleMenuItemClick = (action) => {
    setMenuOpen(false);
    switch (action) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'administracion':
        navigate('/administracion');
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  if (!user) {
    return <div className="loading-container">Cargando...</div>;
  }

  return (
    <div className={`administracion-container ${menuOpen ? 'menu-open' : ''}`}>
      {menuOpen && (
        <div 
          className="menu-overlay"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Pharmavel - Administración</h1>
          <div className="header-right">
            <button 
              className="nav-button"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </button>
            <div className="clientes-menu">
              <button 
                className="nav-button"
                onClick={() => setClientesMenuOpen(!clientesMenuOpen)}
              >
                Clientes ▼
              </button>
              {clientesMenuOpen && (
                <div className="clientes-dropdown">
                  <button onClick={() => { setClientesMenuOpen(false); navigate('/crear-cliente'); }}>
                    ➕ Crear Cliente
                  </button>
                  <button onClick={() => { setClientesMenuOpen(false); navigate('/listar-clientes'); }}>
                    📋 Actualizar Clientes
                  </button>
                </div>
              )}
            </div>
            <button 
              className="nav-button"
              onClick={() => navigate('/catalogo-productos')}
            >
              Catálogo
            </button>
            <button 
              className="nav-button"
              onClick={() => navigate('/almacenes')}
            >
              Almacenes
            </button>
            <div className="user-menu">
              <button 
                className="menu-toggle"
                onClick={handleMenuToggle}
                aria-label="Menú de usuario"
              >
                <span className="user-name">{user.name || user.username}</span>
                <span className="menu-icon">▼</span>
              </button>
              
              {menuOpen && (
                <div className="dropdown-menu">
                  <button 
                    className="menu-item logout-item"
                    onClick={() => handleMenuItemClick('logout')}
                  >
                    <span className="menu-icon-item">🚪</span>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="administracion-main">
        <div className="administracion-content">
          <h2>Manejo de Usuarios</h2>
          
          <div className="admin-options">
            <div className="option-card">
              <div className="option-icon">👥</div>
              <h3>Listar Usuarios</h3>
              <p>Ver todos los usuarios del sistema</p>
              <button 
                className="option-button"
                onClick={() => navigate('/administracion/usuarios')}
              >
                Ver Usuarios
              </button>
            </div>

            <div className="option-card">
              <div className="option-icon">➕</div>
              <h3>Crear Usuario</h3>
              <p>Agregar un nuevo usuario al sistema</p>
              <button 
                className="option-button"
                onClick={() => navigate('/administracion/usuarios/crear')}
              >
                Crear Usuario
              </button>
            </div>

            <div className="option-card">
              <div className="option-icon">🎭</div>
              <h3>Gestión de Roles</h3>
              <p>Crear y administrar roles del sistema</p>
              <button 
                className="option-button"
                onClick={() => navigate('/administracion/roles')}
              >
                Gestionar Roles
              </button>
            </div>

            <div className="option-card">
              <div className="option-icon">🔒</div>
              <h3>Cambiar Contraseña</h3>
              <p>Actualizar contraseñas de usuarios</p>
              <button 
                className="option-button"
                onClick={() => navigate('/administracion/cambiar-contrasena')}
              >
                Cambiar Contraseña
              </button>
            </div>

            <div className="option-card">
              <div className="option-icon">🚫</div>
              <h3>Desactivar Usuario</h3>
              <p>Deshabilitar acceso de usuarios</p>
              <button className="option-button">Desactivar Usuario</button>
            </div>

            <div className="option-card">
              <div className="option-icon">📊</div>
              <h3>Estadísticas de Usuarios</h3>
              <p>Ver métricas y estadísticas de usuarios</p>
              <button className="option-button">Ver Estadísticas</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Administracion;