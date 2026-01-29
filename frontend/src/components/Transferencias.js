import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUser, clearAuth, getToken } from '../utils/auth';
import './IngresoAlmacen.css';

const ALMACEN_CODIGOS = {
  'la-paz': 'LPZ',
  'cochabamba': 'CBB',
  'santa-cruz': 'SCZ'
};

const ALMACENES_OPCIONES = [
  { codigo: 'LPZ', nombre: 'La Paz' },
  { codigo: 'CBB', nombre: 'Cochabamba' },
  { codigo: 'SCZ', nombre: 'Santa Cruz' }
];

function Transferencias() {
  const { almacen } = useParams();
  const location = window.location;
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clientesMenuOpen, setClientesMenuOpen] = useState(false);
  const [productos, setProductos] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [transferencias, setTransferencias] = useState([]);
  const [activeTab, setActiveTab] = useState('solicitud'); // solicitud, enviar, recibir
  const [selectedTransferencia, setSelectedTransferencia] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const [formSolicitud, setFormSolicitud] = useState({
    almacen_origen: ALMACEN_CODIGOS[almacen] || '',
    almacen_destino: '',
    productos: [],
    observaciones: ''
  });

  const [productoActual, setProductoActual] = useState({
    id_producto: '',
    cantidad_solicitada: '',
    lote: '',
    observaciones: ''
  });

  useEffect(() => {
    const userData = getUser();
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);
    fetchProductos();
    fetchAlmacenes();
    
    // Verificar si hay un producto preseleccionado desde inventario
    const productoPreseleccionado = localStorage.getItem('productoTransferencia');
    if (productoPreseleccionado && activeTab === 'solicitud') {
      try {
        const producto = JSON.parse(productoPreseleccionado);
        setProductoActual(prev => ({
          ...prev,
          id_producto: producto.id_producto.toString(),
          cantidad_solicitada: producto.stock_disponible ? Math.min(producto.stock_disponible, 10).toString() : '1'
        }));
        localStorage.removeItem('productoTransferencia');
      } catch (e) {
        console.error('Error al parsear producto preseleccionado:', e);
      }
    }
    
    if (activeTab === 'recibir') {
      fetchTransferenciasPendientes();
    } else if (activeTab === 'enviar') {
      fetchTransferenciasParaEnviar();
    }
  }, [navigate, almacen, activeTab]);

  const fetchTransferenciasParaEnviar = async () => {
    try {
      const token = getToken();
      const codigoAlmacen = ALMACEN_CODIGOS[almacen];
      const response = await fetch(`${process.env.REACT_APP_API_URL}/transferencias?almacen=${codigoAlmacen}&estado=Pendiente`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransferencias(data.data || []);
      }
    } catch (err) {
      console.error('Error al obtener transferencias para enviar:', err);
    }
  };

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

  const fetchAlmacenes = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/almacenes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAlmacenes(data.data || []);
      }
    } catch (err) {
      console.error('Error al obtener almacenes:', err);
    }
  };

  const fetchTransferenciasPendientes = async () => {
    try {
      const token = getToken();
      const codigoAlmacen = ALMACEN_CODIGOS[almacen];
      const response = await fetch(`${process.env.REACT_APP_API_URL}/transferencias/pendientes/${codigoAlmacen}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransferencias(data.data || []);
      }
    } catch (err) {
      console.error('Error al obtener transferencias pendientes:', err);
    }
  };

  const agregarProducto = () => {
    if (!productoActual.id_producto || !productoActual.cantidad_solicitada) {
      setMessage({ type: 'error', text: 'Complete producto y cantidad' });
      return;
    }

    const producto = productos.find(p => p.id === parseInt(productoActual.id_producto));
    setFormSolicitud(prev => ({
      ...prev,
      productos: [...prev.productos, {
        id_producto: parseInt(productoActual.id_producto),
        cantidad_solicitada: parseInt(productoActual.cantidad_solicitada),
        lote: productoActual.lote || null,
        observaciones: productoActual.observaciones || null,
        producto_nombre: producto?.item || ''
      }]
    }));

    setProductoActual({
      id_producto: '',
      cantidad_solicitada: '',
      lote: '',
      observaciones: ''
    });
  };

  const eliminarProducto = (index) => {
    setFormSolicitud(prev => ({
      ...prev,
      productos: prev.productos.filter((_, i) => i !== index)
    }));
  };

  const handleSolicitudSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!formSolicitud.almacen_destino) {
      setMessage({ type: 'error', text: 'Seleccione almacén destino' });
      return;
    }

    if (formSolicitud.productos.length === 0) {
      setMessage({ type: 'error', text: 'Agregue al menos un producto' });
      return;
    }

    // Validar que todos los productos tengan datos válidos
    const productosInvalidos = formSolicitud.productos.filter(p => !p.id_producto || !p.cantidad_solicitada || p.cantidad_solicitada <= 0);
    if (productosInvalidos.length > 0) {
      setMessage({ type: 'error', text: 'Algunos productos no tienen datos válidos. Verifique producto y cantidad.' });
      return;
    }

    try {
      setSaving(true);
      const token = getToken();
      
      // Asegurar que almacen_origen esté actualizado desde el parámetro de la URL
      const codigoAlmacenOrigen = ALMACEN_CODIGOS[almacen] || formSolicitud.almacen_origen;
      
      // Preparar datos para enviar (limpiar campos no necesarios)
      const datosEnvio = {
        almacen_origen: codigoAlmacenOrigen,
        almacen_destino: formSolicitud.almacen_destino,
        productos: formSolicitud.productos.map(p => ({
          id_producto: parseInt(p.id_producto),
          cantidad_solicitada: parseInt(p.cantidad_solicitada),
          lote: p.lote && p.lote.trim() ? p.lote.trim() : null,
          observaciones: p.observaciones && p.observaciones.trim() ? p.observaciones.trim() : null
        })),
        observaciones: formSolicitud.observaciones && formSolicitud.observaciones.trim() ? formSolicitud.observaciones.trim() : null
      };

      console.log('Datos a enviar:', datosEnvio);
      console.log('Parámetro almacen de URL:', almacen);
      console.log('Código almacen origen calculado:', codigoAlmacenOrigen);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/transferencias`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datosEnvio)
      });

      const data = await response.json();
      console.log('Respuesta del servidor:', data);

      if (!response.ok) {
        console.error('Error del servidor:', data);
        const errorMsg = data.message || data.error || `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      setMessage({ type: 'success', text: data.message || 'Solicitud de transferencia creada correctamente' });
      setFormSolicitud({
        almacen_origen: ALMACEN_CODIGOS[almacen] || '',
        almacen_destino: '',
        productos: [],
        observaciones: ''
      });

      // Limpiar también el producto actual
      setProductoActual({
        id_producto: '',
        cantidad_solicitada: '',
        lote: '',
        observaciones: ''
      });

    } catch (err) {
      console.error('Error:', err);
      setMessage({ type: 'error', text: err.message || 'Error al crear la transferencia' });
    } finally {
      setSaving(false);
    }
  };

  const handleEnviarSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTransferencia) {
      setMessage({ type: 'error', text: 'Seleccione una transferencia' });
      return;
    }

    try {
      setSaving(true);
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/transferencias/${selectedTransferencia.id}/enviar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productos: selectedTransferencia.detalles.map(d => ({
            id_producto: d.id_producto,
            cantidad_enviada: d.cantidad_enviada || d.cantidad_solicitada,
            lote: d.lote
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al enviar la transferencia');
      }

      setMessage({ type: 'success', text: 'Mercancía enviada correctamente' });
      setSelectedTransferencia(null);
      fetchTransferenciasPendientes();

    } catch (err) {
      console.error('Error:', err);
      setMessage({ type: 'error', text: err.message || 'Error al enviar la transferencia' });
    } finally {
      setSaving(false);
    }
  };

  const handleRecibirSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTransferencia) {
      setMessage({ type: 'error', text: 'Seleccione una transferencia' });
      return;
    }

    try {
      setSaving(true);
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/transferencias/${selectedTransferencia.id}/recibir`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productos: selectedTransferencia.detalles.map(d => ({
            id_producto: d.id_producto,
            cantidad_recibida: d.cantidad_enviada || d.cantidad_solicitada,
            lote: d.lote,
            observaciones: d.observaciones
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al recibir la transferencia');
      }

      setMessage({ type: 'success', text: 'Mercancía recibida correctamente' });
      setSelectedTransferencia(null);
      fetchTransferenciasPendientes();

    } catch (err) {
      console.error('Error:', err);
      setMessage({ type: 'error', text: err.message || 'Error al recibir la transferencia' });
    } finally {
      setSaving(false);
    }
  };

  const cargarTransferencia = async (id) => {
    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/transferencias/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTransferencia(data.data);
      }
    } catch (err) {
      console.error('Error al cargar transferencia:', err);
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
          <h1>Pharmavel - Transferencias {almacenNombre}</h1>
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
          <h2>Gestión de Transferencias</h2>
          
          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="tabs-container">
            <button 
              className={`tab-button ${activeTab === 'solicitud' ? 'active' : ''}`}
              onClick={() => setActiveTab('solicitud')}
            >
              Nueva Solicitud
            </button>
            <button 
              className={`tab-button ${activeTab === 'enviar' ? 'active' : ''}`}
              onClick={() => setActiveTab('enviar')}
            >
              Enviar Mercancía
            </button>
            <button 
              className={`tab-button ${activeTab === 'recibir' ? 'active' : ''}`}
              onClick={() => setActiveTab('recibir')}
            >
              Recibir Mercancía
            </button>
          </div>

          {activeTab === 'solicitud' && (
            <form onSubmit={handleSolicitudSubmit} className="ingreso-form">
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label htmlFor="almacen_origen">Almacén Origen *</label>
                  <input
                    type="text"
                    id="almacen_origen"
                    value={formSolicitud.almacen_origen}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="almacen_destino">Almacén Destino *</label>
                  <select
                    id="almacen_destino"
                    value={formSolicitud.almacen_destino}
                    onChange={(e) => setFormSolicitud(prev => ({ ...prev, almacen_destino: e.target.value }))}
                    required
                    disabled={saving}
                  >
                    <option value="">Seleccione...</option>
                    {ALMACENES_OPCIONES.filter(a => a.codigo !== formSolicitud.almacen_origen).map(a => (
                      <option key={a.codigo} value={a.codigo}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h3>Agregar Productos</h3>
                <div className="form-row form-row-4">
                  <div className="form-group">
                    <label>Producto</label>
                    <select
                      value={productoActual.id_producto}
                      onChange={(e) => setProductoActual(prev => ({ ...prev, id_producto: e.target.value }))}
                    >
                      <option value="">Seleccione...</option>
                      {productos.map(p => (
                        <option key={p.id} value={p.id}>{p.item}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Cantidad</label>
                    <input
                      type="number"
                      value={productoActual.cantidad_solicitada}
                      onChange={(e) => setProductoActual(prev => ({ ...prev, cantidad_solicitada: e.target.value }))}
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Lote</label>
                    <input
                      type="text"
                      value={productoActual.lote}
                      onChange={(e) => setProductoActual(prev => ({ ...prev, lote: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>&nbsp;</label>
                    <button type="button" className="btn-add" onClick={agregarProducto}>
                      ➕ Agregar
                    </button>
                  </div>
                </div>

                {formSolicitud.productos.length > 0 && (
                  <div className="productos-list">
                    <h4>Productos agregados:</h4>
                    {formSolicitud.productos.map((prod, index) => (
                      <div key={index} className="producto-item">
                        <span>{prod.producto_nombre} - Cantidad: {prod.cantidad_solicitada}</span>
                        <button type="button" onClick={() => eliminarProducto(index)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="observaciones">Observaciones</label>
                <textarea
                  id="observaciones"
                  value={formSolicitud.observaciones}
                  onChange={(e) => setFormSolicitud(prev => ({ ...prev, observaciones: e.target.value }))}
                  rows="3"
                  disabled={saving}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => navigate('/almacenes')} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear Solicitud'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'enviar' && (
            <div>
              {transferencias.length === 0 ? (
                <p>No hay transferencias pendientes de enviar</p>
              ) : (
                <div>
                  <h3>Transferencias Pendientes de Enviar</h3>
                  {transferencias.map(transf => (
                    <div key={transf.id} className="transferencia-card">
                      <div>
                        <strong>Transferencia #{transf.id}</strong>
                        <p>Desde: {transf.origen_nombre} → Hacia: {transf.destino_nombre}</p>
                        <p>Estado: {transf.estado}</p>
                      </div>
                      <button onClick={() => cargarTransferencia(transf.id)}>
                        Ver Detalles
                      </button>
                    </div>
                  ))}

                  {selectedTransferencia && (
                    <form onSubmit={handleEnviarSubmit} className="ingreso-form">
                      <h3>Detalles de Transferencia #{selectedTransferencia.id}</h3>
                      <div className="productos-list">
                        {selectedTransferencia.detalles.map((det, index) => (
                          <div key={index} className="producto-item">
                            <div>
                              <strong>{det.producto_nombre}</strong>
                              <p>Cantidad solicitada: {det.cantidad_solicitada}</p>
                            </div>
                            <input
                              type="number"
                              placeholder="Cantidad a enviar"
                              defaultValue={det.cantidad_solicitada}
                              min="0"
                              max={det.cantidad_solicitada}
                              onChange={(e) => {
                                const nuevosDetalles = [...selectedTransferencia.detalles];
                                nuevosDetalles[index].cantidad_enviada = parseInt(e.target.value) || 0;
                                setSelectedTransferencia({ ...selectedTransferencia, detalles: nuevosDetalles });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => setSelectedTransferencia(null)}>
                          Cancelar
                        </button>
                        <button type="submit" className="btn-submit" disabled={saving}>
                          {saving ? 'Enviando...' : 'Confirmar Envío'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'recibir' && (
            <div>
              {transferencias.length === 0 ? (
                <p>No hay transferencias pendientes de recibir</p>
              ) : (
                <div>
                  <h3>Transferencias Pendientes</h3>
                  {transferencias.map(transf => (
                    <div key={transf.id} className="transferencia-card">
                      <div>
                        <strong>Transferencia #{transf.id}</strong>
                        <p>Desde: {transf.origen_nombre} → Hacia: {transf.destino_nombre}</p>
                        <p>Estado: {transf.estado}</p>
                      </div>
                      <button onClick={() => cargarTransferencia(transf.id)}>
                        Ver Detalles
                      </button>
                    </div>
                  ))}

                  {selectedTransferencia && (
                    <form onSubmit={handleRecibirSubmit} className="ingreso-form">
                      <h3>Detalles de Transferencia #{selectedTransferencia.id}</h3>
                      <div className="productos-list">
                        {selectedTransferencia.detalles.map((det, index) => (
                          <div key={index} className="producto-item">
                            <div>
                              <strong>{det.producto_nombre}</strong>
                              <p>Solicitado: {det.cantidad_solicitada} | Enviado: {det.cantidad_enviada}</p>
                            </div>
                            <input
                              type="number"
                              placeholder="Cantidad recibida"
                              defaultValue={det.cantidad_enviada || det.cantidad_solicitada}
                              min="0"
                              onChange={(e) => {
                                const nuevosDetalles = [...selectedTransferencia.detalles];
                                nuevosDetalles[index].cantidad_recibida = parseInt(e.target.value) || 0;
                                setSelectedTransferencia({ ...selectedTransferencia, detalles: nuevosDetalles });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => setSelectedTransferencia(null)}>
                          Cancelar
                        </button>
                        <button type="submit" className="btn-submit" disabled={saving}>
                          {saving ? 'Guardando...' : 'Confirmar Recepción'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default Transferencias;
