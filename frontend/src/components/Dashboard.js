import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearAuth } from '../utils/auth';
import './Dashboard.css';

function Dashboard() {
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
    setUser(userData);
  }, [navigate]);

  const handleLogout = () => {
    // Limpiar autenticación
    clearAuth();
    // Limpiar todo el localStorage por si acaso
    localStorage.clear();
    // Forzar recarga completa
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
    <div className={`dashboard-container ${menuOpen ? 'menu-open' : ''}`}>
      {menuOpen && (
        <div 
          className="menu-overlay"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Pharmavel Dashboard</h1>
          <div className="header-right">
            <button 
              className="nav-button active"
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
                  {user.role === 'admin' && (
                    <button 
                      className="menu-item"
                      onClick={() => handleMenuItemClick('administracion')}
                    >
                      <span className="menu-icon-item">⚙️</span>
                      Administración
                    </button>
                  )}
                  <div className="menu-divider"></div>
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

      <main className="dashboard-main">
        <div className="dashboard-content">
          <h2>Bienvenido al Dashboard</h2>
          <p>Contenido del dashboard aquí...</p>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;