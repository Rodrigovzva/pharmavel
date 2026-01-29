const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Crear nuevo producto
router.post('/productos', authenticateToken, async (req, res) => {
  try {
    const { item, categoria } = req.body;

    // Validaciones
    if (!item || !item.trim()) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'El nombre del item es obligatorio'
      });
    }

    if (!categoria) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'La categoría es obligatoria'
      });
    }

    // Verificar que el item no exista
    const existingItem = await query('SELECT id FROM productos WHERE item = ?', [item]);
    if (existingItem.length > 0) {
      return res.status(400).json({
        error: 'Item duplicado',
        message: 'Ya existe un producto con ese nombre'
      });
    }

    // Obtener el nombre del usuario que registra
    const registradoPor = req.user.username;

    // Insertar producto
    const result = await query(`
      INSERT INTO productos (item, categoria, activo, registrado_por)
      VALUES (?, ?, 1, ?)
    `, [item, categoria, registradoPor]);

    res.status(201).json({
      success: true,
      message: 'Producto creado correctamente',
      data: {
        id: result.insertId,
        item,
        categoria,
        registrado_por: registradoPor
      }
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear el producto'
    });
  }
});

// Obtener todos los productos
router.get('/productos', authenticateToken, async (req, res) => {
  try {
    const productos = await query(`
      SELECT 
        id, item, categoria, activo,
        registrado_por, modificado_por, created_at, updated_at
      FROM productos 
      WHERE activo = 1
      ORDER BY item ASC
    `);

    res.json({
      success: true,
      data: productos,
      total: productos.length
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los productos'
    });
  }
});

// Obtener un producto por ID
router.get('/productos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const productos = await query('SELECT * FROM productos WHERE id = ?', [id]);

    if (productos.length === 0) {
      return res.status(404).json({
        error: 'Producto no encontrado',
        message: 'No existe un producto con ese ID'
      });
    }

    res.json({
      success: true,
      data: productos[0]
    });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el producto'
    });
  }
});

// Actualizar producto
router.put('/productos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { item, categoria } = req.body;

    // Verificar que el producto existe
    const existingProduct = await query('SELECT id FROM productos WHERE id = ?', [id]);
    if (existingProduct.length === 0) {
      return res.status(404).json({
        error: 'Producto no encontrado',
        message: 'No existe un producto con ese ID'
      });
    }

    // Verificar item único si se proporciona
    if (item) {
      const duplicateItem = await query(
        'SELECT id FROM productos WHERE item = ? AND id != ?',
        [item, id]
      );
      if (duplicateItem.length > 0) {
        return res.status(400).json({
          error: 'Item duplicado',
          message: 'Ya existe otro producto con ese nombre'
        });
      }
    }

    // Construir query
    const updates = [];
    const values = [];

    if (item !== undefined) {
      updates.push('item = ?');
      values.push(item);
    }
    if (categoria !== undefined) {
      updates.push('categoria = ?');
      values.push(categoria);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Sin cambios',
        message: 'No se proporcionaron datos para actualizar'
      });
    }

    // Agregar quién modificó
    updates.push('modificado_por = ?');
    values.push(req.user.username);

    values.push(id);
    await query(`UPDATE productos SET ${updates.join(', ')} WHERE id = ?`, values);

    // Obtener producto actualizado
    const updatedProduct = await query('SELECT * FROM productos WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Producto actualizado correctamente',
      data: updatedProduct[0]
    });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el producto'
    });
  }
});

// Eliminar producto (desactivar)
router.delete('/productos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const productos = await query('SELECT id FROM productos WHERE id = ?', [id]);
    if (productos.length === 0) {
      return res.status(404).json({
        error: 'Producto no encontrado',
        message: 'No existe un producto con ese ID'
      });
    }

    await query('UPDATE productos SET activo = 0, modificado_por = ? WHERE id = ?', [req.user.username, id]);

    res.json({
      success: true,
      message: 'Producto eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo eliminar el producto'
    });
  }
});

module.exports = router;
