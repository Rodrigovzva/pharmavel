import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUser, clearAuth, getToken } from '../utils/auth';
import './IngresoAlmacen.css';

const MOTIVOS_INGRESO = [
  { value: 'Compra', label: 'Compra' },
  { value: 'Devolución', label: 'Devolución' },
  { value: 'Ajuste positivo', label: 'Ajuste positivo' }
];

const ALMACEN_CODIGOS = {
  'la-paz': 'LPZ',
  'cochabamba': 'CBB',
  'santa-cruz': 'SCZ'
};

function IngresoAlmacenNuevo() {
  const { almacen } = useParams();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clientesMenuOpen, setClientesMenuOpen] = useState(false);
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    almacen: ALMACEN_CODIGOS[almacen] || '',
    id_producto: '',
    cantidad: '',
    lote: '',
    motivo: '',
    nota: ''
  });

  useEffect(() => {
    const userData = getUser();
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);
    fetchProductos();
  }, [navigate, almacen]);

  useEffect(() => {
    if (busquedaProducto.trim()) {
      const busquedaLower = busquedaProducto.toLowerCase().trim();
      const filtrados = productos.filter(p => {
        const itemMatch = p.item.toLowerCase().includes(busquedaLower);
        const categoriaMatch = p.categoria?.toLowerCase().includes(busquedaLower);
        return itemMatch || categoriaMatch;
      }).slice(0, 10); // Limitar a 10 resultados para mejor rendimiento
      
      setProductosFiltrados(filtrados);
      setMostrarDropdown(true);
    } else {
      setProductosFiltrados([]);
      setMostrarDropdown(false);
    }
  }, [busquedaProducto, productos]);

  const fetchProductos = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/productos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProductos(data.data || []);
      }
    } catch (err) {
      console.error('Error al obtener productos:', err);
    }
  };

  const handleProductoSelect = (producto) => {
    setFormData(prev => ({
      ...prev,
      id_producto: producto.id.toString()
    }));
    setBusquedaProducto(producto.item);
    setMostrarDropdown(false);
  };

  const handleBusquedaFocus = () => {
    if (busquedaProducto.trim() && productosFiltrados.length > 0) {
      setMostrarDropdown(true);
    }
  };

  const handleBusquedaBlur = () => {
    // Delay para permitir el click en las opciones
    setTimeout(() => {
      setMostrarDropdown(false);
    }, 200);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.id_producto) {
      setMessage({ type: 'error', text: 'Seleccione un producto' });
      return;
    }

    if (!formData.cantidad || formData.cantidad <= 0) {
      setMessage({ type: 'error', text: 'Ingrese una cantidad válida' });
      return;
    }

    if (!formData.motivo) {
      setMessage({ type: 'error', text: 'Seleccione un motivo' });
      return;
    }

    try {
      setSaving(true);
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/movimientos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tipo: 'INGRESO',
          almacen: formData.almacen,
          id_producto: parseInt(formData.id_producto),
          cantidad: parseInt(formData.cantidad),
          lote: formData.lote || null,
          motivo: formData.motivo,
          nota: formData.nota || null,
          fecha: formData.fecha ? new Date(formData.fecha).toISOString() : new Date().toISOString()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al registrar el ingreso');
      }

      setMessage({ type: 'success', text: 'Ingreso registrado correctamente' });
      
      setTimeout(() => {
        navigate('/almacenes');
      }, 2000);

    } catch (err) {
      console.error('Error:', err);
      setMessage({ type: 'error', text: err.message || 'Error al registrar el ingreso' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    localStorage.clear();
    window.location.replace('/login');
  };

  if (!user) {
    return <div className="loading-container">Cargando...</div>;
  }

  const almacenNombre = almacen === 'la-paz' ? 'La Paz' : almacen === 'cochabamba' ? 'Cochabamba' : 'Santa Cruz';

  return (
    <div className={`ingreso-almacen-container ${menuOpen ? 'menu-open' : ''}`}>
      {menuOpen && (
        <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>
      )}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Pharmavel - Ingreso {almacenNombre}</h1>
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
          <h2>Registrar Ingreso</h2>
          
          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="ingreso-form">
            <div className="form-row form-row-2">
              <div className="form-group">
                <label htmlFor="fecha">Fecha *</label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                />
              </div>
              <div className="form-group">
                <label htmlFor="almacen">Almacén *</label>
                <input
                  type="text"
                  id="almacen"
                  name="almacen"
                  value={formData.almacen}
                  disabled
                />
              </div>
            </div>

            <div className="form-row form-row-2">
              <div className="form-group">
                <label htmlFor="busqueda_producto">Buscar Producto *</label>
                <div className="producto-search-container">
                  <input
                    type="text"
                    id="busqueda_producto"
                    value={busquedaProducto}
                    onChange={(e) => {
                      setBusquedaProducto(e.target.value);
                      if (e.target.value.trim() === '') {
                        setFormData(prev => ({ ...prev, id_producto: '' }));
                      }
                    }}
                    onFocus={handleBusquedaFocus}
                    onBlur={handleBusquedaBlur}
                    placeholder="Escribe para buscar producto..."
                    disabled={saving}
                    required
                    autoComplete="off"
                  />
                  {mostrarDropdown && (
                    <div className="producto-dropdown">
                      {productosFiltrados.length > 0 ? (
                        productosFiltrados.map(producto => (
                          <div
                            key={producto.id}
                            className="producto-option"
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevenir blur antes del click
                              handleProductoSelect(producto);
                            }}
                          >
                            <span className="producto-nombre">{producto.item}</span>
                            <span className="producto-categoria">{producto.categoria}</span>
                          </div>
                        ))
                      ) : (
                        <div className="producto-option producto-no-results">
                          No se encontraron productos
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {formData.id_producto && (
                  <small className="producto-selected-hint">
                    ✓ Producto seleccionado
                  </small>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="cantidad">Cantidad *</label>
                <input
                  type="number"
                  id="cantidad"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleInputChange}
                  required
                  min="1"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-row form-row-2">
              <div className="form-group">
                <label htmlFor="lote">Lote/Serie</label>
                <input
                  type="text"
                  id="lote"
                  name="lote"
                  value={formData.lote}
                  onChange={handleInputChange}
                  disabled={saving}
                />
              </div>
              <div className="form-group">
                <label htmlFor="motivo">Motivo *</label>
                <select
                  id="motivo"
                  name="motivo"
                  value={formData.motivo}
                  onChange={handleInputChange}
                  required
                  disabled={saving}
                >
                  <option value="">Seleccione...</option>
                  {MOTIVOS_INGRESO.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="nota">Nota</label>
              <textarea
                id="nota"
                name="nota"
                value={formData.nota}
                onChange={handleInputChange}
                rows="3"
                disabled={saving}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => navigate('/almacenes')} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="btn-submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Registrar Ingreso'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default IngresoAlmacenNuevo;
