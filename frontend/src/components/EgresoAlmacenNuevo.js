import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUser, clearAuth, getToken } from '../utils/auth';
import './IngresoAlmacen.css';

const MOTIVOS_EGRESO = [
  { value: 'Venta', label: 'Venta' },
  { value: 'Consumo', label: 'Consumo' },
  { value: 'Ajuste negativo', label: 'Ajuste negativo' }
];

const ALMACEN_CODIGOS = {
  'la-paz': 'LPZ',
  'cochabamba': 'CBB',
  'santa-cruz': 'SCZ'
};

function EgresoAlmacenNuevo() {
  const { almacen } = useParams();
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clientesMenuOpen, setClientesMenuOpen] = useState(false);
  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [stockDisponible, setStockDisponible] = useState(null);
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

  // Actualizar almacen cuando cambie el parámetro de la URL
  useEffect(() => {
    const codigoAlmacen = ALMACEN_CODIGOS[almacen] || '';
    console.log('Actualizando almacen en Egreso:', { almacen, codigoAlmacen });
    setFormData(prev => ({
      ...prev,
      almacen: codigoAlmacen
    }));
  }, [almacen]);

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
      const filtrados = productos.filter(p => 
        p.item.toLowerCase().includes(busquedaProducto.toLowerCase())
      );
      setProductosFiltrados(filtrados);
      setMostrarDropdown(true);
    } else {
      setProductosFiltrados([]);
      setMostrarDropdown(false);
    }
  }, [busquedaProducto, productos]);

  useEffect(() => {
    // Asegurar que tenemos el almacén correcto desde la URL
    const codigoAlmacen = ALMACEN_CODIGOS[almacen] || formData.almacen;
    
    if (formData.id_producto && codigoAlmacen) {
      console.log('useEffect trigger - Consultando stock para:', { id_producto: formData.id_producto, almacen: codigoAlmacen });
      fetchStock();
    } else {
      console.log('useEffect - Faltan datos:', { id_producto: formData.id_producto, almacen: codigoAlmacen, almacen_param: almacen });
    }
  }, [formData.id_producto, formData.almacen, almacen]);

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

  const fetchStock = async () => {
    // Asegurar que tenemos el almacén correcto desde la URL
    const codigoAlmacen = ALMACEN_CODIGOS[almacen] || formData.almacen;
    const productoId = formData.id_producto ? parseInt(formData.id_producto) : null;
    
    if (!productoId || !codigoAlmacen) {
      console.log('Faltan datos para consultar stock:', { id_producto: productoId, almacen: codigoAlmacen, formData_id_producto: formData.id_producto });
      setStockDisponible(0);
      return;
    }
    
    try {
      const token = getToken();
      const url = `${process.env.REACT_APP_API_URL}/movimientos/stock?almacen=${codigoAlmacen}&id_producto=${productoId}`;
      console.log('=== CONSULTANDO STOCK ===');
      console.log('URL:', url);
      console.log('Parámetros:', { 
        almacen_param: almacen, 
        codigo_almacen: codigoAlmacen, 
        id_producto_original: formData.id_producto,
        id_producto_parseado: productoId,
        tipo_id_producto: typeof productoId
      });
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Status de respuesta:', response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('=== RESPUESTA STOCK ===');
        console.log('Respuesta completa:', JSON.stringify(data, null, 2));
        console.log('data.data existe?', !!data.data);
        console.log('data.data es array?', Array.isArray(data.data));
        console.log('data.data.length:', data.data ? data.data.length : 'N/A');
        
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          const stock = data.data[0].stock_actual;
          console.log('Stock encontrado en data.data[0].stock_actual:', stock);
          console.log('Tipo de stock:', typeof stock);
          setStockDisponible(stock);
        } else {
          console.log('⚠️ No se encontró stock - array vacío o sin datos');
          console.log('data.data:', data.data);
          setStockDisponible(0);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Error al obtener stock:', response.status);
        console.error('Respuesta de error:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          console.error('Error parseado:', errorData);
        } catch (e) {
          console.error('No se pudo parsear error como JSON');
        }
        setStockDisponible(0);
      }
    } catch (err) {
      console.error('❌ Excepción al obtener stock:', err);
      console.error('Stack:', err.stack);
      setStockDisponible(0);
    }
  };

  const handleProductoSelect = (producto) => {
    console.log('Producto seleccionado:', producto);
    setFormData(prev => {
      const nuevoEstado = {
        ...prev,
        id_producto: producto.id.toString()
      };
      console.log('Nuevo estado formData:', nuevoEstado);
      return nuevoEstado;
    });
    setBusquedaProducto(producto.item);
    setMostrarDropdown(false);
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

    if (stockDisponible !== null && parseInt(formData.cantidad) > stockDisponible) {
      setMessage({ type: 'error', text: `Stock insuficiente. Disponible: ${stockDisponible}` });
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
          tipo: 'EGRESO',
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
        throw new Error(data.message || 'Error al registrar el egreso');
      }

      setMessage({ type: 'success', text: 'Egreso registrado correctamente' });
      
      setTimeout(() => {
        navigate('/almacenes');
      }, 2000);

    } catch (err) {
      console.error('Error:', err);
      setMessage({ type: 'error', text: err.message || 'Error al registrar el egreso' });
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
          <h1>Pharmavel - Egreso {almacenNombre}</h1>
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
          <h2>Registrar Egreso</h2>
          
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
                    onChange={(e) => setBusquedaProducto(e.target.value)}
                    placeholder="Buscar producto..."
                    disabled={saving}
                    required
                  />
                  {mostrarDropdown && productosFiltrados.length > 0 && (
                    <div className="producto-dropdown">
                      {productosFiltrados.map(producto => (
                        <div
                          key={producto.id}
                          className="producto-option"
                          onClick={() => handleProductoSelect(producto)}
                        >
                          {producto.item} ({producto.categoria})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formData.id_producto && stockDisponible !== null && (
                  <small className="producto-selected-hint" style={{ color: stockDisponible > 0 ? '#4CAF50' : '#F44336' }}>
                    ✓ Stock disponible: {stockDisponible}
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
                  max={stockDisponible || undefined}
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
                  {MOTIVOS_EGRESO.map(m => (
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
                {saving ? 'Guardando...' : 'Registrar Egreso'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default EgresoAlmacenNuevo;
