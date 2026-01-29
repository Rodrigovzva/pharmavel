const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { registrarKardex, obtenerSaldoActual } = require('../utils/kardex');

// Crear movimiento de inventario (INGRESO o EGRESO)
router.post('/movimientos', authenticateToken, async (req, res) => {
  try {
    const {
      tipo,
      almacen,
      id_producto,
      cantidad,
      lote,
      motivo,
      nota,
      fecha
    } = req.body;

    const usuario = req.user.username;

    // Validaciones
    if (!tipo || !['INGRESO', 'EGRESO'].includes(tipo)) {
      return res.status(400).json({
        error: 'Tipo inválido',
        message: 'El tipo debe ser INGRESO o EGRESO'
      });
    }

    if (!almacen || !id_producto || !cantidad || cantidad <= 0) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Almacén, producto y cantidad son requeridos'
      });
    }

    // Validar stock disponible para egresos
    if (tipo === 'EGRESO') {
      const saldoActual = await obtenerSaldoActual(id_producto, almacen);
      if (saldoActual < cantidad) {
        return res.status(400).json({
          error: 'Stock insuficiente',
          message: `Stock disponible: ${saldoActual}. Cantidad solicitada: ${cantidad}`,
          stockActual: saldoActual,
          cantidadSolicitada: cantidad
        });
      }
    }

    // Verificar que el almacén existe
    const almacenes = await query('SELECT id FROM almacenes WHERE codigo = ? AND activo = 1', [almacen]);
    if (almacenes.length === 0) {
      return res.status(400).json({
        error: 'Almacén inválido',
        message: 'El almacén especificado no existe'
      });
    }

    // Verificar que el producto existe
    const productos = await query('SELECT id FROM productos WHERE id = ? AND activo = 1', [id_producto]);
    if (productos.length === 0) {
      return res.status(400).json({
        error: 'Producto inválido',
        message: 'El producto especificado no existe'
      });
    }

    // Formatear fecha para MySQL (YYYY-MM-DD HH:MM:SS)
    let fechaMovimiento;
    if (fecha) {
      const fechaObj = new Date(fecha);
      fechaMovimiento = fechaObj.toISOString().slice(0, 19).replace('T', ' ');
    } else {
      fechaMovimiento = new Date().toISOString().slice(0, 19).replace('T', ' ');
    }

    // Crear movimiento
    const resultado = await query(`
      INSERT INTO movimientos_inventario (
        tipo, almacen, id_producto, cantidad, fecha, usuario, lote, motivo, nota
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [tipo, almacen, id_producto, cantidad, fechaMovimiento, usuario, lote || null, motivo || null, nota || null]);

    const movimientoId = resultado.insertId;

    // Registrar en kardex
    await registrarKardex(id_producto, fechaMovimiento, almacen, movimientoId, tipo, cantidad);

    // Obtener saldo resultante
    const saldoResultante = await obtenerSaldoActual(id_producto, almacen);

    res.status(201).json({
      success: true,
      message: `${tipo} registrado correctamente`,
      data: {
        id: movimientoId,
        tipo,
        almacen,
        id_producto,
        cantidad,
        saldo_resultante: saldoResultante
      }
    });
  } catch (error) {
    console.error('Error al crear movimiento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo registrar el movimiento'
    });
  }
});

// Obtener movimientos de inventario
router.get('/movimientos', authenticateToken, async (req, res) => {
  try {
    const { almacen, tipo, id_producto, fecha_inicio, fecha_fin } = req.query;

    let sql = `
      SELECT m.*, p.item as producto_nombre, p.categoria as producto_categoria
      FROM movimientos_inventario m
      INNER JOIN productos p ON m.id_producto = p.id
      WHERE 1=1
    `;
    const params = [];

    if (almacen) {
      sql += ' AND m.almacen = ?';
      params.push(almacen);
    }

    if (tipo) {
      sql += ' AND m.tipo = ?';
      params.push(tipo);
    }

    if (id_producto) {
      sql += ' AND m.id_producto = ?';
      params.push(id_producto);
    }

    if (fecha_inicio) {
      sql += ' AND m.fecha >= ?';
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      sql += ' AND m.fecha <= ?';
      params.push(fecha_fin);
    }

    sql += ' ORDER BY m.fecha DESC, m.id DESC LIMIT 500';

    const movimientos = await query(sql, params);

    res.json({
      success: true,
      data: movimientos,
      total: movimientos.length
    });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los movimientos'
    });
  }
});

// Obtener stock actual por almacén y producto
router.get('/movimientos/stock', authenticateToken, async (req, res) => {
  try {
    const { almacen, id_producto } = req.query;

    if (!almacen) {
      return res.status(400).json({
        error: 'Almacén requerido',
        message: 'Debe especificar el almacén'
      });
    }

    if (id_producto) {
      // Stock de un producto específico
      const { obtenerSaldoActual } = require('../utils/kardex');
      const productoId = parseInt(id_producto);
      
      const saldo = await obtenerSaldoActual(productoId, almacen);
      
      const productos = await query('SELECT id, item as producto_nombre, categoria as producto_categoria FROM productos WHERE id = ? AND activo = 1', [productoId]);
      
      const resultado = productos.length > 0 ? [{
        id_producto: productos[0].id,
        producto_nombre: productos[0].producto_nombre,
        producto_categoria: productos[0].producto_categoria,
        almacen,
        stock_actual: saldo
      }] : [];
      
      res.json({
        success: true,
        data: resultado,
        almacen
      });
    } else {
      // Stock de todos los productos
      const productos = await query('SELECT id, item, categoria FROM productos WHERE activo = 1');
      const { obtenerSaldoActual } = require('../utils/kardex');
      
      const stock = await Promise.all(productos.map(async (p) => {
        const saldo = await obtenerSaldoActual(p.id, almacen);
        return {
          id_producto: p.id,
          producto_nombre: p.item,
          producto_categoria: p.categoria,
          almacen,
          stock_actual: saldo
        };
      }));

      res.json({
        success: true,
        data: stock,
        almacen
      });
    }
  } catch (error) {
    console.error('Error al obtener stock:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el stock'
    });
  }
});

module.exports = router;
