import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearAuth, getToken } from '../utils/auth';
import './CrearUsuario.css';

function CrearUsuario() {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clientesMenuOpen, setClientesMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    cedula: '',
    contacto_referencia: '',
    rol: 'user',
    foto: ''
  });
  const [fotoPreview, setFotoPreview] = useState(null);
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
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Por favor seleccione un archivo de imagen' });
        return;
      }
      
      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'La imagen no debe superar los 2MB' });
        return;
      }

      // Convertir a base64 para preview y almacenamiento
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
        setFormData(prev => ({
          ...prev,
          foto: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFoto = () => {
    setFotoPreview(null);
    setFormData(prev => ({
      ...prev,
      foto: ''
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setMessage({ type: 'error', text: 'El nombre de usuario es obligatorio' });
      return false;
    }
    if (!formData.password) {
      setMessage({ type: 'error', text: 'La contraseña es obligatoria' });
      return false;
    }
    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return false;
    }
    if (!formData.nombre.trim()) {
      setMessage({ type: 'error', text: 'El nombre completo es obligatorio' });
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setMessage({ type: 'error', text: 'El formato del email no es válido' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const token = getToken();
      const dataToSend = { ...formData };
      delete dataToSend.confirmPassword;

      const response = await fetch(`${process.env.REACT_APP_API_URL}/usuarios`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al crear usuario');
      }

      setMessage({ type: 'success', text: 'Usuario creado correctamente' });
      
      // Limpiar formulario
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        nombre: '',
        direccion: '',
        telefono: '',
        email: '',
        cedula: '',
        contacto_referencia: '',
        rol: 'user',
        foto: ''
      });
      setFotoPreview(null);

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate('/administracion/usuarios');
      }, 2000);

    } catch (err) {
      console.error('Error:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="loading-container">Cargando...</div>;
  }

  return (
    <div className={`crear-usuario-container ${menuOpen ? 'menu-open' : ''}`}>
      {menuOpen && (
        <div 
          className="menu-overlay"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
      
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Pharmavel - Crear Usuario</h1>
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

      <main className="crear-usuario-main">
        <div className="crear-usuario-content">
          <div className="page-header">
            <button 
              className="back-button"
              onClick={() => navigate('/administracion')}
            >
              ← Volver
            </button>
            <h2>Nuevo Usuario</h2>
            <div></div>
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="usuario-form">
            <div className="form-section">
              <h3>Información de Acceso</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="username">Usuario *</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Nombre de usuario para login"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="rol">Rol *</label>
                  <select
                    id="rol"
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
                  >
                    <option value="user">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Contraseña *</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Repita la contraseña"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Datos Personales</h3>
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="nombre">Nombre Completo *</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Nombre y apellidos"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cedula">C.I. (Cédula)</label>
                  <input
                    type="text"
                    id="cedula"
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleInputChange}
                    placeholder="Número de cédula"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="telefono">Teléfono</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="Número de teléfono"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="direccion">Dirección</label>
                  <input
                    type="text"
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    placeholder="Dirección completa"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group full-width">
                  <label htmlFor="contacto_referencia">Contacto de Referencia</label>
                  <input
                    type="text"
                    id="contacto_referencia"
                    name="contacto_referencia"
                    value={formData.contacto_referencia}
                    onChange={handleInputChange}
                    placeholder="Nombre y teléfono de contacto de referencia"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Foto de Perfil</h3>
              <div className="foto-upload-container">
                {fotoPreview ? (
                  <div className="foto-preview">
                    <img src={fotoPreview} alt="Preview" />
                    <button 
                      type="button" 
                      className="remove-foto"
                      onClick={removeFoto}
                    >
                      ✕ Eliminar
                    </button>
                  </div>
                ) : (
                  <div className="foto-placeholder">
                    <label htmlFor="foto" className="foto-label">
                      <span className="foto-icon">📷</span>
                      <span>Seleccionar imagen</span>
                      <span className="foto-hint">JPG, PNG (máx. 2MB)</span>
                    </label>
                    <input
                      type="file"
                      id="foto"
                      name="foto"
                      accept="image/*"
                      onChange={handleFotoChange}
                      hidden
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => navigate('/administracion')}
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn-save"
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>

          <div className="form-info">
            <p>* Campos obligatorios</p>
            <p>El usuario será registrado por: <strong>{user.username}</strong></p>
            <p>Fecha de registro: <strong>{new Date().toLocaleDateString('es-ES')}</strong></p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CrearUsuario;
