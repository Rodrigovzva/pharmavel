import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearAuth, getToken } from '../utils/auth';
import './CambiarContrasena.css';

function CambiarContrasena() {
  const [user, setUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clientesMenuOpen, setClientesMenuOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
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
    fetchUsuarios();
  }, [navigate]);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/usuarios`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener usuarios');
      }

      const data = await response.json();
      setUsuarios(data.data || []);
    } catch (err) {
      console.error('Error:', err);
      setMessage({ type: 'error', text: 'No se pudieron cargar los usuarios' });
    } finally {
      setLoading(false);
    }
  };

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

  const handleSelectUser = (usuario) => {
    setSelectedUser(usuario);
    setFormData({ newPassword: '', confirmPassword: '' });
    setMessage(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    // Validaciones
    if (!formData.newPassword || !formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Todos los campos son obligatorios' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    try {
      setSaving(true);
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/usuarios/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newPassword: formData.newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar la contraseña');
      }

      setMessage({ type: 'success', text: `Contraseña de ${selectedUser.username} actualizada correctamente` });
      setFormData({ newPassword: '', confirmPassword: '' });
      setSelectedUser(null);
    } catch (err) {
      console.error('Error:', err);
      setMessage({ type: 'error', text: err.message || 'Error al cambiar la contraseña' });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsuarios = usuarios.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.nombre && u.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!user) {
    return <div className="loading-container">Cargando...</div>;
  }

  return (
    <div className={`cambiar-contrasena-container ${menuOpen ? 'menu-open' : ''}`}>
      {menuOpen && (
        <div 
          className="menu-overlay"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Pharmavel - Cambiar Contraseña</h1>
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

      <main className="cambiar-contrasena-main">
        <div className="cambiar-contrasena-content">
          <div className="page-header">
            <button 
              className="back-button"
              onClick={() => navigate('/administracion')}
            >
              ← Volver
            </button>
            <h2>Cambiar Contraseña de Usuario</h2>
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="cambiar-contrasena-layout">
            {/* Panel izquierdo - Lista de usuarios */}
            <div className="usuarios-panel">
              <h3>Seleccionar Usuario</h3>
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {loading ? (
                <div className="loading">Cargando usuarios...</div>
              ) : (
                <div className="usuarios-list">
                  {filteredUsuarios.map(usuario => (
                    <div 
                      key={usuario.id}
                      className={`usuario-item ${selectedUser?.id === usuario.id ? 'selected' : ''} ${!usuario.activo ? 'inactive' : ''}`}
                      onClick={() => handleSelectUser(usuario)}
                    >
                      <div className="usuario-avatar">
                        {usuario.foto ? (
                          <img src={usuario.foto} alt={usuario.username} />
                        ) : (
                          <span>{usuario.username.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="usuario-info">
                        <span className="usuario-name">{usuario.username}</span>
                        <span className="usuario-role">{usuario.nombre || 'Sin nombre'}</span>
                      </div>
                      <div className={`usuario-status ${usuario.activo ? 'active' : 'inactive'}`}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Panel derecho - Formulario de cambio de contraseña */}
            <div className="password-panel">
              {selectedUser ? (
                <>
                  <div className="selected-user-header">
                    <div className="selected-user-avatar">
                      {selectedUser.foto ? (
                        <img src={selectedUser.foto} alt={selectedUser.username} />
                      ) : (
                        <span>{selectedUser.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="selected-user-info">
                      <h3>{selectedUser.username}</h3>
                      <p>{selectedUser.nombre || 'Sin nombre'}</p>
                      <span className="user-role-badge">{selectedUser.rol}</span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="password-form">
                    <div className="form-group">
                      <label htmlFor="newPassword">Nueva Contraseña</label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        placeholder="Ingrese la nueva contraseña"
                        disabled={saving}
                        minLength={6}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirme la nueva contraseña"
                        disabled={saving}
                      />
                    </div>

                    <div className="password-requirements">
                      <p>Requisitos de la contraseña:</p>
                      <ul>
                        <li className={formData.newPassword.length >= 6 ? 'valid' : ''}>
                          Mínimo 6 caracteres
                        </li>
                        <li className={formData.newPassword === formData.confirmPassword && formData.confirmPassword ? 'valid' : ''}>
                          Las contraseñas coinciden
                        </li>
                      </ul>
                    </div>

                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="cancel-button"
                        onClick={() => setSelectedUser(null)}
                        disabled={saving}
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="submit-button"
                        disabled={saving || !formData.newPassword || !formData.confirmPassword}
                      >
                        {saving ? 'Guardando...' : 'Cambiar Contraseña'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="no-user-selected">
                  <div className="no-user-icon">🔐</div>
                  <h3>Seleccione un usuario</h3>
                  <p>Elija un usuario de la lista para cambiar su contraseña</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CambiarContrasena;
