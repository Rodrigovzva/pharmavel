const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
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

// Crear nuevo usuario
router.post('/usuarios', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      username, 
      password, 
      nombre, 
      direccion, 
      telefono, 
      email, 
      cedula, 
      contacto_referencia, 
      rol, 
      foto 
    } = req.body;

    // Validaciones
    if (!username || !password || !nombre) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Usuario, contraseña y nombre son obligatorios'
      });
    }

    // Verificar que el username no exista
    const existingUser = await query('SELECT id FROM usuarios WHERE username = ?', [username]);
    if (existingUser.length > 0) {
      return res.status(400).json({
        error: 'Usuario duplicado',
        message: 'El nombre de usuario ya está en uso'
      });
    }

    // Verificar email único si se proporciona
    if (email) {
      const existingEmail = await query('SELECT id FROM usuarios WHERE email = ?', [email]);
      if (existingEmail.length > 0) {
        return res.status(400).json({
          error: 'Email duplicado',
          message: 'El email ya está registrado'
        });
      }
    }

    // Verificar cédula única si se proporciona
    if (cedula) {
      const existingCedula = await query('SELECT id FROM usuarios WHERE cedula = ?', [cedula]);
      if (existingCedula.length > 0) {
        return res.status(400).json({
          error: 'Cédula duplicada',
          message: 'La cédula ya está registrada'
        });
      }
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Obtener el nombre del usuario que registra
    const registradoPor = req.user.username;

    // Insertar usuario
    const result = await query(`
      INSERT INTO usuarios (
        username, password, nombre, direccion, telefono, email, 
        cedula, contacto_referencia, rol, foto, activo, registrado_por
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, [
      username,
      hashedPassword,
      nombre,
      direccion || null,
      telefono || null,
      email || null,
      cedula || null,
      contacto_referencia || null,
      rol || 'user',
      foto || null,
      registradoPor
    ]);

    res.status(201).json({
      success: true,
      message: 'Usuario creado correctamente',
      data: {
        id: result.insertId,
        username,
        nombre,
        rol: rol || 'user',
        registrado_por: registradoPor
      }
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear el usuario'
    });
  }
});

// Obtener todos los usuarios
router.get('/usuarios', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const usuarios = await query(`
      SELECT 
        id, 
        username, 
        nombre,
        direccion,
        telefono,
        email,
        cedula,
        contacto_referencia,
        rol,
        foto,
        activo,
        registrado_por,
        modificado_por,
        created_at, 
        updated_at 
      FROM usuarios 
      ORDER BY id ASC
    `);

    res.json({
      success: true,
      data: usuarios,
      total: usuarios.length
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los usuarios'
    });
  }
});

// Obtener un usuario por ID
router.get('/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const usuarios = await query(
      'SELECT id, username, nombre, rol, activo, created_at, updated_at FROM usuarios WHERE id = ?',
      [id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No existe un usuario con ese ID'
      });
    }

    res.json({
      success: true,
      data: usuarios[0]
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el usuario'
    });
  }
});

// Actualizar usuario
router.put('/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      username, 
      nombre, 
      direccion, 
      telefono, 
      email, 
      cedula, 
      contacto_referencia, 
      rol, 
      foto, 
      activo 
    } = req.body;

    // Verificar que el usuario existe
    const existingUser = await query('SELECT id FROM usuarios WHERE id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No existe un usuario con ese ID'
      });
    }

    // Verificar que el username no esté en uso por otro usuario
    if (username) {
      const duplicateUser = await query(
        'SELECT id FROM usuarios WHERE username = ? AND id != ?',
        [username, id]
      );
      if (duplicateUser.length > 0) {
        return res.status(400).json({
          error: 'Usuario duplicado',
          message: 'El nombre de usuario ya está en uso'
        });
      }
    }

    // Verificar email único si se proporciona
    if (email) {
      const duplicateEmail = await query(
        'SELECT id FROM usuarios WHERE email = ? AND id != ?',
        [email, id]
      );
      if (duplicateEmail.length > 0) {
        return res.status(400).json({
          error: 'Email duplicado',
          message: 'El email ya está en uso por otro usuario'
        });
      }
    }

    // Verificar cédula única si se proporciona
    if (cedula) {
      const duplicateCedula = await query(
        'SELECT id FROM usuarios WHERE cedula = ? AND id != ?',
        [cedula, id]
      );
      if (duplicateCedula.length > 0) {
        return res.status(400).json({
          error: 'Cédula duplicada',
          message: 'La cédula ya está registrada por otro usuario'
        });
      }
    }

    // Construir query dinámicamente
    const updates = [];
    const values = [];

    if (username !== undefined) {
      updates.push('username = ?');
      values.push(username);
    }
    if (nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(nombre);
    }
    if (direccion !== undefined) {
      updates.push('direccion = ?');
      values.push(direccion || null);
    }
    if (telefono !== undefined) {
      updates.push('telefono = ?');
      values.push(telefono || null);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email || null);
    }
    if (cedula !== undefined) {
      updates.push('cedula = ?');
      values.push(cedula || null);
    }
    if (contacto_referencia !== undefined) {
      updates.push('contacto_referencia = ?');
      values.push(contacto_referencia || null);
    }
    if (rol !== undefined) {
      updates.push('rol = ?');
      values.push(rol);
    }
    if (foto !== undefined) {
      updates.push('foto = ?');
      values.push(foto || null);
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

    // Siempre agregar quién modificó el registro
    updates.push('modificado_por = ?');
    values.push(req.user.username);

    values.push(id);
    await query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, values);

    // Obtener usuario actualizado
    const updatedUser = await query(
      `SELECT id, username, nombre, direccion, telefono, email, cedula, 
       contacto_referencia, rol, foto, activo, registrado_por, modificado_por, created_at, updated_at 
       FROM usuarios WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Usuario actualizado correctamente',
      data: updatedUser[0]
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el usuario'
    });
  }
});

// Cambiar estado activo/inactivo
router.patch('/usuarios/:id/toggle-status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const usuarios = await query('SELECT id, activo FROM usuarios WHERE id = ?', [id]);
    if (usuarios.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No existe un usuario con ese ID'
      });
    }

    const newStatus = usuarios[0].activo ? 0 : 1;
    await query('UPDATE usuarios SET activo = ?, modificado_por = ? WHERE id = ?', [newStatus, req.user.username, id]);

    res.json({
      success: true,
      message: newStatus ? 'Usuario activado' : 'Usuario desactivado',
      activo: newStatus
    });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo cambiar el estado del usuario'
    });
  }
});

// Cambiar contraseña de usuario
router.put('/usuarios/:id/password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validar que se proporcione la nueva contraseña
    if (!newPassword) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Se requiere la nueva contraseña'
      });
    }

    // Validar longitud mínima
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Contraseña inválida',
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar que el usuario existe
    const usuarios = await query('SELECT id, username FROM usuarios WHERE id = ?', [id]);
    if (usuarios.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No existe un usuario con ese ID'
      });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await query(
      'UPDATE usuarios SET password = ?, modificado_por = ? WHERE id = ?',
      [hashedPassword, req.user.username, id]
    );

    res.json({
      success: true,
      message: `Contraseña de ${usuarios[0].username} actualizada correctamente`
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo cambiar la contraseña'
    });
  }
});

// Eliminar usuario permanentemente
router.delete('/usuarios/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const usuarios = await query('SELECT id, username FROM usuarios WHERE id = ?', [id]);
    if (usuarios.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No existe un usuario con ese ID'
      });
    }

    // No permitir eliminar el último usuario admin activo
    const adminActivos = await query('SELECT COUNT(*) as count FROM usuarios WHERE rol = ? AND activo = 1', ['admin']);
    if (usuarios[0].rol === 'admin' && adminActivos[0].count <= 1) {
      return res.status(400).json({
        error: 'No se puede eliminar',
        message: 'No se puede eliminar el último administrador activo'
      });
    }

    // Eliminar usuario
    await query('DELETE FROM usuarios WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Usuario eliminado permanentemente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo eliminar el usuario'
    });
  }
});

module.exports = router;
