import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearAuth, getToken } from '../utils/auth';
import './CrearCliente.css';

const CIUDADES_BOLIVIA = [
  'La Paz',
  'El Alto',
  'Cochabamba',
  'Santa Cruz',
  'Oruro',
  'Potosí',
  'Chuquisaca',
  'Tarija',
  'Beni',
  'Pando'
];

const ZONAS_DISPONIBLES = [
  'SOPOCACHI', 'CALACOTO', 'COTA COTA', 'ACHUMANI', 'BAJO SEGUENCOMA',
  'MIRAFLORES', 'VILLA FATIMA', 'ALTO OBRAJES', 'OBRAJES', 'SAN PEDRO',
  'CALIRI', 'IRPAVI', 'LOS PINOS', 'LA FLORIDA', 'ALTO MIRAFLORES',
  'VILLA ARMONIA', 'Z. NORTE', 'IRPAVI II', 'EL ALTO', 'KUPINI',
  'ALTO SAN PEDRO', 'CENTRO', 'BOLOGNA', 'ALTO PAMPAHASI', 'VILLA COPACABANA',
  'CIUDAD FERROVIARIA', 'ACHACHICALA', 'EL TEJAR', 'MALLASA', 'BELLA VISTA',
  'VALLE HERMOSO', 'ALTO SEGUENCOMA', 'SAN JORGE', 'BAJO SAN ANTONIO',
  'VILLA PABÓN', 'SAN ANTONIO', 'CHASQUIPAMPA', 'MUNAYPATA', 'VINO TINTO',
  'BAJO SAN ISIDRO', 'VILLA VICTORIA', 'ALTO SOPOCACHI', 'VILLA EL CARMEN',
  'VILLA LA MERCED', 'PURA PURA', 'COTAHUMA', 'CRISTO REY', 'ALTO AUQUISAMAÑA',
  'ALTO SAN ANTONIO', 'ALTO TACAGUA', 'ARANJUEZ', 'PERIFERICA', 'MALLASILLA',
  'PAMPAHASI', 'BAJO AUQUISAMAÑA', 'KOANI', 'ALTO CHIJINI', 'TEMBLADERANI',
  'BAJO PAMPAHASI', 'BAJO LLOJETA', 'ALTO IRPAVI', 'COCHABAMBA', 'HUAJCHILLA',
  'BARRIO GRAFICO', 'ALTO LLOJETA', 'BAJO TACAGUA', 'SAID', 'JUPAPINA', 'OVEJUYO'
];

function CrearCliente() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clientesMenuOpen, setClientesMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    nombre_comercial: '',
    razon_social: '',
    nit: '',
    telefono: '',
    telefono_secundario: '',
    direccion: '',
    ciudad: '',
    zona: '',
    foto_domicilio: '',
    gps_lat: '',
    gps_lng: ''
  });
  const [fotoPreview, setFotoPreview] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [zonaSearch, setZonaSearch] = useState('');
  const [showZonaDropdown, setShowZonaDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = getUser();
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(userData);

    // Obtener ubicación GPS automáticamente al cargar
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            gps_lat: position.coords.latitude.toString(),
            gps_lng: position.coords.longitude.toString()
          }));
        },
        (error) => {
          console.log('No se pudo obtener la ubicación automáticamente:', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }, [navigate]);

  // Cerrar dropdown de zonas al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.zona-search-container')) {
        setShowZonaDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Por favor seleccione un archivo de imagen' });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'La imagen no debe superar los 5MB' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, foto_domicilio: reader.result }));
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFoto = () => {
    setFormData(prev => ({ ...prev, foto_domicilio: '' }));
    setFotoPreview(null);
  };

  const getLocationByIP = async () => {
    try {
      // Usar API gratuita de geolocalización por IP
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        setFormData(prev => ({
          ...prev,
          gps_lat: data.latitude.toString(),
          gps_lng: data.longitude.toString()
        }));
        setMessage({ type: 'success', text: `Ubicación aproximada obtenida: ${data.latitude}, ${data.longitude} (${data.city || 'N/A'})` });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error con geolocalización por IP:', error);
      return false;
    }
  };

  const getLocation = async () => {
    setGettingLocation(true);
    setMessage({ type: 'info', text: 'Obteniendo ubicación...' });

    // Primero intentar con geolocalización del navegador
    if (navigator.geolocation && window.isSecureContext) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            gps_lat: position.coords.latitude.toFixed(6),
            gps_lng: position.coords.longitude.toFixed(6)
          }));
          setMessage({ type: 'success', text: `Ubicación precisa: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}` });
          setGettingLocation(false);
        },
        async (error) => {
          console.log('Geolocalización del navegador falló, intentando por IP...');
          // Si falla, intentar por IP
          const success = await getLocationByIP();
          if (!success) {
            setMessage({ type: 'error', text: 'No se pudo obtener la ubicación. Ingrese las coordenadas manualmente.' });
          }
          setGettingLocation(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      // Si no hay geolocalización o no es contexto seguro, usar IP
      console.log('Contexto no seguro (HTTP), usando geolocalización por IP...');
      const success = await getLocationByIP();
      if (!success) {
        setMessage({ type: 'error', text: 'No se pudo obtener la ubicación. Ingrese las coordenadas manualmente.' });
      }
      setGettingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Validaciones
    if (!formData.nombre_completo.trim()) {
      setMessage({ type: 'error', text: 'El nombre completo es obligatorio' });
      return;
    }

    if (!formData.nit.trim()) {
      setMessage({ type: 'error', text: 'El NIT es obligatorio' });
      return;
    }

    if (!formData.telefono || !formData.telefono.trim()) {
      setMessage({ type: 'error', text: 'El teléfono es obligatorio' });
      return;
    }

    if (!formData.direccion || !formData.direccion.trim()) {
      setMessage({ type: 'error', text: 'La dirección es obligatoria' });
      return;
    }

    if (!formData.zona || !formData.zona.trim()) {
      setMessage({ type: 'error', text: 'La zona es obligatoria' });
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setMessage({ type: 'error', text: 'El email no es válido' });
      return;
    }

    try {
      setSaving(true);
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/clientes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear el cliente');
      }

      setMessage({ type: 'success', text: 'Cliente creado correctamente' });
      
      // Limpiar formulario
      setFormData({
        nombre_completo: '',
        email: '',
        nombre_comercial: '',
        razon_social: '',
        nit: '',
        telefono: '',
        telefono_secundario: '',
        direccion: '',
        zona: '',
        foto_domicilio: '',
        gps_lat: '',
        gps_lng: ''
      });
      setFotoPreview(null);

    } catch (err) {
      console.error('Error:', err);
      setMessage({ type: 'error', text: err.message || 'Error al crear el cliente' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="loading-container">Cargando...</div>;
  }

  return (
    <div className={`crear-cliente-container ${menuOpen ? 'menu-open' : ''}`}>
      {menuOpen && (
        <div 
          className="menu-overlay"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
      
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Pharmavel - Crear Cliente</h1>
          <div className="header-right">
            <button 
              className="nav-button"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </button>
            <div className="clientes-menu">
              <button 
                className="nav-button active"
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

      <main className="crear-cliente-main">
        <div className="crear-cliente-content">
          <div className="page-header">
            <button 
              className="back-button"
              onClick={() => navigate('/dashboard')}
            >
              ← Volver
            </button>
            <h2>Nuevo Cliente</h2>
            <div></div>
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="cliente-form">
            {/* Información básica */}
            <div className="form-section">
              <h3>Información Básica</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre_completo">Nombre Completo *</label>
                  <input
                    type="text"
                    id="nombre_completo"
                    name="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={handleInputChange}
                    placeholder="Ingrese el nombre completo"
                    disabled={saving}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="ejemplo@correo.com"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Información comercial */}
            <div className="form-section">
              <h3>Información Comercial</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nombre_comercial">Nombre Comercial</label>
                  <input
                    type="text"
                    id="nombre_comercial"
                    name="nombre_comercial"
                    value={formData.nombre_comercial}
                    onChange={handleInputChange}
                    placeholder="Nombre del negocio"
                    disabled={saving}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="razon_social">Razón Social</label>
                  <input
                    type="text"
                    id="razon_social"
                    name="razon_social"
                    value={formData.razon_social}
                    onChange={handleInputChange}
                    placeholder="Razón social de la empresa"
                    disabled={saving}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nit">NIT *</label>
                  <input
                    type="text"
                    id="nit"
                    name="nit"
                    value={formData.nit}
                    onChange={handleInputChange}
                    placeholder="Número de NIT"
                    disabled={saving}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="form-section">
              <h3>Información de Contacto</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="telefono">Teléfono *</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="Teléfono principal"
                    disabled={saving}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="telefono_secundario">Teléfono Secundario</label>
                  <input
                    type="tel"
                    id="telefono_secundario"
                    name="telefono_secundario"
                    value={formData.telefono_secundario}
                    onChange={handleInputChange}
                    placeholder="Teléfono alternativo"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="form-section">
              <h3>Ubicación</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="direccion">Dirección *</label>
                  <input
                    type="text"
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    placeholder="Dirección completa"
                    disabled={saving}
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="ciudad">Ciudad *</label>
                  <select
                    id="ciudad"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    disabled={saving}
                    required
                  >
                    <option value="">Seleccione una ciudad</option>
                    {CIUDADES_BOLIVIA.map(ciudad => (
                      <option key={ciudad} value={ciudad}>
                        {ciudad}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group zona-search-container">
                  <label htmlFor="zona">Zona *</label>
                  <div className="zona-input-wrapper">
                    <input
                      type="text"
                      id="zona"
                      value={zonaSearch || formData.zona}
                      onChange={(e) => {
                        setZonaSearch(e.target.value);
                        setShowZonaDropdown(true);
                        if (!e.target.value) {
                          setFormData(prev => ({ ...prev, zona: '' }));
                        }
                      }}
                      onFocus={() => setShowZonaDropdown(true)}
                      placeholder="Buscar zona..."
                      disabled={saving}
                      autoComplete="off"
                    />
                    {formData.zona && (
                      <button 
                        type="button" 
                        className="clear-zona-btn"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, zona: '' }));
                          setZonaSearch('');
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {showZonaDropdown && (
                    <div className="zona-dropdown">
                      {ZONAS_DISPONIBLES
                        .filter(zona => 
                          zona.toLowerCase().includes((zonaSearch || '').toLowerCase())
                        )
                        .slice(0, 10)
                        .map((zona, index) => (
                          <div 
                            key={index}
                            className={`zona-option ${formData.zona === zona ? 'selected' : ''}`}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, zona }));
                              setZonaSearch(zona);
                              setShowZonaDropdown(false);
                            }}
                          >
                            {zona}
                          </div>
                        ))
                      }
                      {ZONAS_DISPONIBLES.filter(zona => 
                        zona.toLowerCase().includes((zonaSearch || '').toLowerCase())
                      ).length === 0 && (
                        <div className="zona-no-results">
                          No se encontraron zonas
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="form-group gps-group">
                  <label>Coordenadas GPS</label>
                  <div className="gps-inputs">
                    <input
                      type="text"
                      name="gps_lat"
                      value={formData.gps_lat}
                      onChange={handleInputChange}
                      placeholder="Latitud"
                      disabled={saving}
                    />
                    <input
                      type="text"
                      name="gps_lng"
                      value={formData.gps_lng}
                      onChange={handleInputChange}
                      placeholder="Longitud"
                      disabled={saving}
                    />
                    <button 
                      type="button" 
                      className="gps-button"
                      onClick={getLocation}
                      disabled={saving || gettingLocation}
                    >
                      {gettingLocation ? '⏳ Obteniendo...' : '📍 Obtener'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Foto del domicilio */}
            <div className="form-section">
              <h3>Foto del Domicilio</h3>
              <div className="foto-upload-section">
                {fotoPreview ? (
                  <div className="foto-preview-container">
                    <img src={fotoPreview} alt="Vista previa" className="foto-preview" />
                    <button 
                      type="button" 
                      className="remove-foto-btn"
                      onClick={removeFoto}
                      disabled={saving}
                    >
                      ✕ Eliminar
                    </button>
                  </div>
                ) : (
                  <div className="foto-placeholder">
                    <input
                      type="file"
                      id="foto_domicilio"
                      accept="image/*"
                      onChange={handleFotoChange}
                      disabled={saving}
                      className="foto-input"
                    />
                    <label htmlFor="foto_domicilio" className="foto-label">
                      <span className="foto-icon">📷</span>
                      <span>Seleccionar imagen</span>
                      <span className="foto-hint">PNG, JPG hasta 5MB</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Información del registro */}
            <div className="form-section info-section">
              <div className="info-item">
                <span className="info-label">Registrado por:</span>
                <span className="info-value">{user.name || user.username}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Fecha:</span>
                <span className="info-value">{new Date().toLocaleDateString('es-ES')}</span>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => navigate('/dashboard')}
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-save"
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar Cliente'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default CrearCliente;
