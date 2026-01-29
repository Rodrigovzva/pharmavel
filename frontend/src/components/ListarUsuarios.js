import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, clearAuth, getToken } from '../utils/auth';
import './ListarUsuarios.css';

function ListarUsuarios() {
  const [user, setUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clientesMenuOpen, setClientesMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    username: '',
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    cedula: '',
    contacto_referencia: '',
    rol: 'user',
    foto: '',
    activo: true
  });
  const [fotoPreview, setFotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
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
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('No se pudieron cargar los usuarios');
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

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Funciones de edición
  const handleEditClick = (usuario) => {
    setEditingUser(usuario);
    setEditForm({
      username: usuario.username,
      nombre: usuario.nombre || '',
      direccion: usuario.direccion || '',
      telefono: usuario.telefono || '',
      email: usuario.email || '',
      cedula: usuario.cedula || '',
      contacto_referencia: usuario.contacto_referencia || '',
      rol: usuario.rol,
      foto: usuario.foto || '',
      activo: usuario.activo === 1
    });
    setFotoPreview(usuario.foto || null);
    setEditModalOpen(true);
    setMessage(null);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Por favor seleccione un archivo de imagen' });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'La imagen no debe superar los 2MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
        setEditForm(prev => ({ ...prev, foto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFoto = () => {
    setFotoPreview(null);
    setEditForm(prev => ({ ...prev, foto: '' }));
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/usuarios/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar usuario');
      }

      setMessage({ type: 'success', text: 'Usuario actualizado correctamente' });
      fetchUsuarios();
      
      setTimeout(() => {
        setEditModalOpen(false);
        setEditingUser(null);
        setMessage(null);
      }, 1500);

    } catch (err) {
      console.error('Error:', err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (usuario) => {
    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/usuarios/${usuario.id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cambiar estado');
      }

      fetchUsuarios();
    } catch (err) {
      console.error('Error:', err);
      alert('Error al cambiar estado del usuario');
    }
  };

  const handleDelete = async (usuario) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar permanentemente al usuario "${usuario.username}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/usuarios/${usuario.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar usuario');
      }

      setMessage({ type: 'success', text: 'Usuario eliminado permanentemente' });
      fetchUsuarios();
    } catch (err) {
      console.error('Error:', err);
      setMessage({ type: 'error', text: err.message || 'Error al eliminar usuario' });
    }
  };

  const closeModal = () => {
    setEditModalOpen(false);
    setEditingUser(null);
    setMessage(null);
    setFotoPreview(null);
  };

  if (!user) {
    return <div className="loading-container">Cargando...</div>;
  }

  return (
    <div className={`listar-usuarios-container ${menuOpen ? 'menu-open' : ''}`}>
      {menuOpen && (
        <div 
          className="menu-overlay"
          onClick={() => setMenuOpen(false)}
        ></div>
      )}
      
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Pharmavel - Usuarios</h1>
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

      <main className="listar-usuarios-main">
        <div className="listar-usuarios-content">
          <div className="page-header">
            <button 
              className="back-button"
              onClick={() => navigate('/administracion')}
            >
              ← Volver
            </button>
            <h2>Reporte de Usuarios</h2>
            <button 
              className="refresh-button"
              onClick={fetchUsuarios}
              disabled={loading}
            >
              🔄 Actualizar
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando usuarios...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={fetchUsuarios}>Reintentar</button>
            </div>
          ) : (
            <>
              <div className="usuarios-summary">
                <div className="summary-card">
                  <span className="summary-number">{usuarios.length}</span>
                  <span className="summary-label">Total Usuarios</span>
                </div>
                <div className="summary-card">
                  <span className="summary-number">
                    {usuarios.filter(u => u.activo).length}
                  </span>
                  <span className="summary-label">Activos</span>
                </div>
                <div className="summary-card">
                  <span className="summary-number">
                    {usuarios.filter(u => !u.activo).length}
                  </span>
                  <span className="summary-label">Inactivos</span>
                </div>
                <div className="summary-card">
                  <span className="summary-number">
                    {usuarios.filter(u => u.rol === 'admin').length}
                  </span>
                  <span className="summary-label">Administradores</span>
                </div>
              </div>

              <div className="usuarios-table-container">
                <table className="usuarios-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Usuario</th>
                      <th>Nombre</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Fecha Creación</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id} className={!usuario.activo ? 'inactive-row' : ''}>
                        <td>{usuario.id}</td>
                        <td className="username-cell">{usuario.username}</td>
                        <td>{usuario.nombre || '-'}</td>
                        <td>
                          <span className={`rol-badge ${usuario.rol}`}>
                            {usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${usuario.activo ? 'active' : 'inactive'}`}>
                            {usuario.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td>{formatDate(usuario.created_at)}</td>
                        <td className="actions-cell">
                          <button 
                            className="action-btn edit-btn"
                            onClick={() => handleEditClick(usuario)}
                            title="Editar usuario"
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            className={`action-btn toggle-btn ${usuario.activo ? 'deactivate' : 'activate'}`}
                            onClick={() => handleToggleStatus(usuario)}
                            title={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {usuario.activo ? '🚫 Desactivar' : '✅ Activar'}
                          </button>
                          <button 
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(usuario)}
                            title="Eliminar usuario permanentemente"
                            style={{ backgroundColor: '#dc3545', color: 'white' }}
                          >
                            🗑️ Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {usuarios.length === 0 && (
                <div className="empty-state">
                  <p>No hay usuarios registrados</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modal de Edición */}
      {editModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Usuario</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {message && (
                  <div className={`message ${message.type}`}>
                    {message.text}
                  </div>
                )}

                <div className="form-section">
                  <h4>Información de Acceso</h4>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="username">Usuario</label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={editForm.username}
                        onChange={handleEditFormChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="rol">Rol</label>
                      <select
                        id="rol"
                        name="rol"
                        value={editForm.rol}
                        onChange={handleEditFormChange}
                      >
                        <option value="user">Usuario</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>Datos Personales</h4>
                  <div className="form-group">
                    <label htmlFor="nombre">Nombre Completo</label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={editForm.nombre}
                      onChange={handleEditFormChange}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="cedula">C.I. (Cédula)</label>
                      <input
                        type="text"
                        id="cedula"
                        name="cedula"
                        value={editForm.cedula}
                        onChange={handleEditFormChange}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="telefono">Teléfono</label>
                      <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        value={editForm.telefono}
                        onChange={handleEditFormChange}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={editForm.email}
                      onChange={handleEditFormChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="direccion">Dirección</label>
                    <input
                      type="text"
                      id="direccion"
                      name="direccion"
                      value={editForm.direccion}
                      onChange={handleEditFormChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="contacto_referencia">Contacto de Referencia</label>
                    <input
                      type="text"
                      id="contacto_referencia"
                      name="contacto_referencia"
                      value={editForm.contacto_referencia}
                      onChange={handleEditFormChange}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h4>Foto de Perfil</h4>
                  <div className="foto-upload-container">
                    {fotoPreview ? (
                      <div className="foto-preview-small">
                        <img src={fotoPreview} alt="Preview" />
                        <button 
                          type="button" 
                          className="remove-foto-btn"
                          onClick={removeFoto}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label htmlFor="foto-edit" className="foto-placeholder-small">
                        <span>📷</span>
                        <span>Agregar foto</span>
                      </label>
                    )}
                    <input
                      type="file"
                      id="foto-edit"
                      accept="image/*"
                      onChange={handleFotoChange}
                      hidden
                    />
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-group checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        name="activo"
                        checked={editForm.activo}
                        onChange={handleEditFormChange}
                      />
                      Usuario Activo
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-save"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListarUsuarios;
