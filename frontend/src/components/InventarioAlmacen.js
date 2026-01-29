import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUser, clearAuth, getToken } from '../utils/auth';
import './IngresoAlmacen.css';

const ALMACEN_CODIGOS = {
  'la-paz': 'LPZ',
  'cochabamba': 'CBB',
  'santa-cruz': 'SCZ'
};

const ALMACEN_NOMBRES = {
  'la-paz': 'La Paz',
  'cochabamba': 'Cochabamba',
  'santa-cruz': 'Santa Cruz'
};


function InventarioAlmacen() {
  const { almacen } = useParams();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clientesMenuOpen, setClientesMenuOpen] = useState(false);
  const [inventario, setInventario] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stock'); // stock, movimientos
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = getUser();
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);
    fetchInventario();
    fetchMovimientos();
  }, [navigate, almacen]);

  const fetchInventario = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const codigoAlmacen = ALMACEN_CODIGOS[almacen];
      const response = await fetch(`${process.env.REACT_APP_API_URL}/movimientos/stock?almacen=${codigoAlmacen}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInventario(data.data || []);
      }
    } catch (err) {
      console.error('Error al obtener inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovimientos = async () => {
    try {
      const token = getToken();
      const codigoAlmacen = ALMACEN_CODIGOS[almacen];
      const response = await fetch(`${process.env.REACT_APP_API_URL}/movimientos?almacen=${codigoAlmacen}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMovimientos(data.data || []);
      }
    } catch (err) {
      console.error('Error al obtener movimientos:', err);
    }
  };

  const handleCrearTransferencia = (producto) => {
    // Guardar producto seleccionado en localStorage para pre-llenar en transferencias
    localStorage.setItem('productoTransferencia', JSON.stringify({
      id_producto: producto.id_producto,
      producto_nombre: producto.producto_nombre,
      stock_disponible: producto.stock_actual
    }));
    navigate(`/almacenes/${almacen}/transferencias`);
  };

  const handleLogout = () => {
    clearAuth();
    localStorage.clear();
    window.location.replace('/login');
  };

  if (!user) {
    return <div className="loading-container">Cargando...</div>;
  }

  const codigoAlmacen = ALMACEN_CODIGOS[almacen];
  const nombreAlmacen = ALMACEN_NOMBRES[almacen];

  const inventarioFiltrado = inventario.filter(item => 
    item.producto_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    item.producto_categoria?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const movimientosFiltrados = movimientos.filter(mov =>
    mov.producto_nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className={`ingreso-almacen-container ${menuOpen ? 'menu-open' : ''}`}>
      {menuOpen && (
        <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>
      )}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Pharmavel - Inventario {nombreAlmacen}</h1>
          <div className="header-right">
            <button className="nav-button" onClick={() => navigate('/dashboard')}>Dashboard</button>
            <div className="clientes-menu">
              <button className="nav-button" onClick={() => setClientesMenuOpen(!clientesMenuOpen)}>
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
            <button className="nav-button" onClick={() => navigate('/catalogo-productos')}>Catálogo</button>
            <button className="nav-button active" onClick={() => navigate('/almacenes')}>Almacenes</button>
            <div className="user-menu">
              <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                <span className="user-name">{user.name || user.username}</span>
                <span className="menu-icon">▼</span>
              </button>
              {menuOpen && (
                <div className="dropdown-menu">
                  {user.role === 'admin' && (
                    <button className="menu-item" onClick={() => navigate('/administracion')}>
                      <span className="menu-icon-item">⚙️</span> Administración
                    </button>
                  )}
                  <div className="menu-divider"></div>
                  <button className="menu-item logout-item" onClick={handleLogout}>
                    <span className="menu-icon-item">🚪</span> Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="ingreso-main">
        <div className="ingreso-content">
          <div className="inventario-header">
            <h2>Inventario - {nombreAlmacen} ({codigoAlmacen})</h2>
            <button 
              className="btn-back"
              onClick={() => navigate('/almacenes')}
            >
              ← Volver a Almacenes
            </button>
          </div>

          <div className="tabs-container">
            <button 
              className={`tab-button ${activeTab === 'stock' ? 'active' : ''}`}
              onClick={() => setActiveTab('stock')}
            >
              📦 Stock Disponible
            </button>
            <button 
              className={`tab-button ${activeTab === 'movimientos' ? 'active' : ''}`}
              onClick={() => setActiveTab('movimientos')}
            >
              📋 Historial de Movimientos
            </button>
          </div>

          <div className="search-container">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="search-input"
            />
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando inventario...</p>
            </div>
          ) : (
            <>
              {activeTab === 'stock' && (
                <div className="inventario-table-container">
                  <table className="inventario-table">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Stock Disponible</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventarioFiltrado.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                            {busqueda ? 'No se encontraron productos' : 'No hay productos registrados'}
                          </td>
                        </tr>
                      ) : (
                        inventarioFiltrado.map(item => (
                          <tr key={item.id_producto}>
                            <td>{item.producto_nombre}</td>
                            <td>{item.producto_categoria}</td>
                            <td>
                              <span className={`stock-badge ${item.stock_actual > 0 ? 'stock-disponible' : 'stock-vacio'}`}>
                                {item.stock_actual}
                              </span>
                            </td>
                            <td>
                              {item.stock_actual > 0 && (
                                <button
                                  className="btn-transferir"
                                  onClick={() => handleCrearTransferencia(item)}
                                  title="Crear transferencia con este producto"
                                >
                                  🔄 Transferir
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'movimientos' && (
                <div className="movimientos-list-container">
                  {movimientosFiltrados.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No hay movimientos registrados
                    </p>
                  ) : (
                    <div className="movimientos-list">
                      {movimientosFiltrados.map(mov => (
                        <div key={mov.id} className="movimiento-item">
                          <div className="movimiento-info">
                            <div className="movimiento-header-item">
                              <strong>{mov.producto_nombre}</strong>
                              <span className={`tipo-badge tipo-${mov.tipo.toLowerCase()}`}>
                                {mov.tipo}
                              </span>
                            </div>
                            <div className="movimiento-details">
                              <span>Cantidad: {mov.cantidad}</span>
                              <span>Motivo: {mov.motivo || 'N/A'}</span>
                              <span>Fecha: {new Date(mov.fecha).toLocaleString()}</span>
                              <span>Usuario: {mov.usuario}</span>
                              {mov.lote && <span>Lote: {mov.lote}</span>}
                            </div>
                            {mov.nota && (
                              <div className="movimiento-nota">
                                <small>Nota: {mov.nota}</small>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default InventarioAlmacen;
