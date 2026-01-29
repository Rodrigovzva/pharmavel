const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Middleware para verificar rol admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado',
      message: 'Se requieren permisos de administrador'
    });
  }
  next();
};

// Obtener todos los roles
router.get('/roles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const roles = await query(`
      SELECT id, nombre, descripcion, permisos, color, activo, created_at, updated_at 
      FROM roles 
      ORDER BY id ASC
    `);

    // Parsear permisos JSON
    const rolesFormatted = roles.map(rol => {
      let permisos = [];
      try {
        if (rol.permisos && typeof rol.permisos === 'string') {
          permisos = JSON.parse(rol.permisos);
        } else if (Array.isArray(rol.permisos)) {
          permisos = rol.permisos;
        }
      } catch (e) {
        permisos = [];
      }
      return { ...rol, permisos };
    });

    res.json({
      success: true,
      data: rolesFormatted,
      total: roles.length
    });
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los roles'
    });
  }
});

// Obtener un rol por ID
router.get('/roles/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const roles = await query('SELECT * FROM roles WHERE id = ?', [id]);

    if (roles.length === 0) {
      return res.status(404).json({
        error: 'Rol no encontrado',
        message: 'No existe un rol con ese ID'
      });
    }

    const rol = roles[0];
    try {
      if (rol.permisos && typeof rol.permisos === 'string') {
        rol.permisos = JSON.parse(rol.permisos);
      } else if (!Array.isArray(rol.permisos)) {
        rol.permisos = [];
      }
    } catch (e) {
      rol.permisos = [];
    }

    res.json({
      success: true,
      data: rol
    });
  } catch (error) {
    console.error('Error al obtener rol:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el rol'
    });
  }
});

// Crear nuevo rol
router.post('/roles', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { nombre, descripcion, permisos, color } = req.body;

    if (!nombre) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'El nombre del rol es obligatorio'
      });
    }

    // Verificar que el nombre no exista
    const existingRol = await query('SELECT id FROM roles WHERE nombre = ?', [nombre]);
    if (existingRol.length > 0) {
      return res.status(400).json({
        error: 'Rol duplicado',
        message: 'Ya existe un rol con ese nombre'
      });
    }

    const permisosJson = JSON.stringify(permisos || []);

    const result = await query(`
      INSERT INTO roles (nombre, descripcion, permisos, color, activo) 
      VALUES (?, ?, ?, ?, 1)
    `, [nombre, descripcion || null, permisosJson, color || '#667eea']);

    res.status(201).json({
      success: true,
      message: 'Rol creado correctamente',
      data: {
        id: result.insertId,
        nombre,
        descripcion,
        permisos: permisos || [],
        color: color || '#667eea'
      }
    });
  } catch (error) {
    console.error('Error al crear rol:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear el rol'
    });
  }
});

// Actualizar rol
router.put('/roles/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, permisos, color, activo } = req.body;

    // Verificar que el rol existe
    const existingRol = await query('SELECT id, nombre FROM roles WHERE id = ?', [id]);
    if (existingRol.length === 0) {
      return res.status(404).json({
        error: 'Rol no encontrado',
        message: 'No existe un rol con ese ID'
      });
    }

    // Verificar que el nombre no esté en uso por otro rol
    if (nombre && nombre !== existingRol[0].nombre) {
      const duplicateRol = await query(
        'SELECT id FROM roles WHERE nombre = ? AND id != ?',
        [nombre, id]
      );
      if (duplicateRol.length > 0) {
        return res.status(400).json({
          error: 'Nombre duplicado',
          message: 'Ya existe otro rol con ese nombre'
        });
      }
    }

    // Construir query dinámicamente
    const updates = [];
    const values = [];

    if (nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(nombre);
    }
    if (descripcion !== undefined) {
      updates.push('descripcion = ?');
      values.push(descripcion);
    }
    if (permisos !== undefined) {
      updates.push('permisos = ?');
      values.push(JSON.stringify(permisos));
    }
    if (color !== undefined) {
      updates.push('color = ?');
      values.push(color);
    }
    if (activo !== undefined) {
      updates.push('activo = ?');
      values.push(activo ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Sin cambios',
        message: 'No se proporcionaron datos para actualizar'
      });
    }

    values.push(id);
    await query(`UPDATE roles SET ${updates.join(', ')} WHERE id = ?`, values);

    // Obtener rol actualizado
    const updatedRol = await query('SELECT * FROM roles WHERE id = ?', [id]);
    try {
      if (updatedRol[0].permisos && typeof updatedRol[0].permisos === 'string') {
        updatedRol[0].permisos = JSON.parse(updatedRol[0].permisos);
      } else if (!Array.isArray(updatedRol[0].permisos)) {
        updatedRol[0].permisos = [];
      }
    } catch (e) {
      updatedRol[0].permisos = [];
    }

    res.json({
      success: true,
      message: 'Rol actualizado correctamente',
      data: updatedRol[0]
    });
  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el rol'
    });
  }
});

// Eliminar rol
router.delete('/roles/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el rol existe
    const existingRol = await query('SELECT nombre FROM roles WHERE id = ?', [id]);
    if (existingRol.length === 0) {
      return res.status(404).json({
        error: 'Rol no encontrado',
        message: 'No existe un rol con ese ID'
      });
    }

    // No permitir eliminar roles del sistema (admin, user)
    if (['admin', 'user'].includes(existingRol[0].nombre)) {
      return res.status(400).json({
        error: 'Operación no permitida',
        message: 'No se pueden eliminar los roles del sistema'
      });
    }

    // Verificar si hay usuarios con este rol
    const usersWithRol = await query('SELECT COUNT(*) as count FROM usuarios WHERE rol = ?', [existingRol[0].nombre]);
    if (usersWithRol[0].count > 0) {
      return res.status(400).json({
        error: 'Rol en uso',
        message: `Hay ${usersWithRol[0].count} usuario(s) con este rol. Cambie su rol antes de eliminar.`
      });
    }

    await query('DELETE FROM roles WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Rol eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar rol:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo eliminar el rol'
    });
  }
});

module.exports = router;
