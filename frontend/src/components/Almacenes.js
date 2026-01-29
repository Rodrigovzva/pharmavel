import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearAuth } from '../utils/auth';
import './Almacenes.css';

function Almacenes() {
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
    clearAuth();
    localStorage.clear();
    window.location.replace('/login');
  };

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const handleMenuItemClick = (action) => {
    setMenuOpen(false);
    if (action === 'logout') {
      handleLogout();
    }
  };

  if (!user) {
    return <div className="loading-container">Cargando...</div>;
  }

  return (
    <div className={`almacenes-container ${menuOpen ? 'menu-open' : ''}`}>
      {menuOpen && (
        <div 
          className="menu-overlay"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Pharmavel - Almacenes</h1>
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
              className="nav-button active"
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
                      onClick={() => navigate('/administracion')}
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

      <main className="almacenes-main">
        <div className="almacenes-content">
          <h2>Gestión de Almacenes</h2>
          
          <div className="almacenes-grid">
            <div className="almacen-card">
              <h3>Almacén La Paz</h3>
              <div className="almacen-buttons">
                <button 
                  className="almacen-btn ingreso"
                  onClick={() => navigate('/almacenes/la-paz/ingreso')}
                >
                  📥 Ingreso
                </button>
                <button 
                  className="almacen-btn egreso"
                  onClick={() => navigate('/almacenes/la-paz/egreso')}
                >
                  📤 Egreso
                </button>
                <button 
                  className="almacen-btn transferencia"
                  onClick={() => navigate('/almacenes/la-paz/transferencias')}
                >
                  🔄 Transferencias
                </button>
                <button 
                  className="almacen-btn inventario"
                  onClick={() => navigate('/almacenes/la-paz/inventario')}
                >
                  📦 Inventario
                </button>
              </div>
            </div>

            <div className="almacen-card">
              <h3>Almacén Cochabamba</h3>
              <div className="almacen-buttons">
                <button 
                  className="almacen-btn ingreso"
                  onClick={() => navigate('/almacenes/cochabamba/ingreso')}
                >
                  📥 Ingreso
                </button>
                <button 
                  className="almacen-btn egreso"
                  onClick={() => navigate('/almacenes/cochabamba/egreso')}
                >
                  📤 Egreso
                </button>
                <button 
                  className="almacen-btn transferencia"
                  onClick={() => navigate('/almacenes/cochabamba/transferencias')}
                >
                  🔄 Transferencias
                </button>
                <button 
                  className="almacen-btn inventario"
                  onClick={() => navigate('/almacenes/cochabamba/inventario')}
                >
                  📦 Inventario
                </button>
              </div>
            </div>

            <div className="almacen-card">
              <h3>Almacén Santa Cruz</h3>
              <div className="almacen-buttons">
                <button 
                  className="almacen-btn ingreso"
                  onClick={() => navigate('/almacenes/santa-cruz/ingreso')}
                >
                  📥 Ingreso
                </button>
                <button 
                  className="almacen-btn egreso"
                  onClick={() => navigate('/almacenes/santa-cruz/egreso')}
                >
                  📤 Egreso
                </button>
                <button 
                  className="almacen-btn transferencia"
                  onClick={() => navigate('/almacenes/santa-cruz/transferencias')}
                >
                  🔄 Transferencias
                </button>
                <button 
                  className="almacen-btn inventario"
                  onClick={() => navigate('/almacenes/santa-cruz/inventario')}
                >
                  📦 Inventario
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Almacenes;
