const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { registrarKardex, obtenerSaldoActual } = require('../utils/kardex');

// Crear solicitud de transferencia
router.post('/transferencias', authenticateToken, async (req, res) => {
  try {
    const {
      almacen_origen,
      almacen_destino,
      productos,
      observaciones
    } = req.body;

    const usuario = req.user.username;

    // Validaciones
    if (!almacen_origen || !almacen_destino) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Almacén origen y destino son requeridos'
      });
    }

    if (almacen_origen === almacen_destino) {
      return res.status(400).json({
        error: 'Almacenes inválidos',
        message: 'El almacén origen y destino deben ser diferentes'
      });
    }

    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Debe especificar al menos un producto'
      });
    }

    // Verificar que los almacenes existen
    console.log('Validando almacenes:', { almacen_origen, almacen_destino });
    const almacenes = await query(
      'SELECT codigo FROM almacenes WHERE codigo IN (?, ?) AND activo = 1',
      [almacen_origen, almacen_destino]
    );
    console.log('Almacenes encontrados:', almacenes);
    console.log('Cantidad de almacenes encontrados:', almacenes.length);
    
    if (almacenes.length !== 2) {
      const almacenesEncontrados = almacenes.map(a => a.codigo);
      const almacenesBuscados = [almacen_origen, almacen_destino];
      const almacenesNoEncontrados = almacenesBuscados.filter(codigo => !almacenesEncontrados.includes(codigo));
      
      return res.status(400).json({
        error: 'Almacenes inválidos',
        message: `Uno o ambos almacenes no existen. Buscados: ${almacenesBuscados.join(', ')}, Encontrados: ${almacenesEncontrados.join(', ')}, No encontrados: ${almacenesNoEncontrados.join(', ')}`
      });
    }

    // Crear transferencia
    const resultadoTransferencia = await query(`
      INSERT INTO transferencias (
        usuario_crea, almacen_origen, almacen_destino, estado, observaciones
      ) VALUES (?, ?, ?, 'Pendiente', ?)
    `, [usuario, almacen_origen, almacen_destino, observaciones || null]);

    const idTransferencia = resultadoTransferencia.insertId;

    // Crear detalles de transferencia
    for (const producto of productos) {
      const { id_producto, cantidad_solicitada, lote, observaciones: obs } = producto;

      if (!id_producto || !cantidad_solicitada || cantidad_solicitada <= 0) {
        continue;
      }

      await query(`
        INSERT INTO transferencias_detalle (
          id_transferencia, id_producto, cantidad_solicitada, lote, observaciones
        ) VALUES (?, ?, ?, ?, ?)
      `, [idTransferencia, id_producto, cantidad_solicitada, lote || null, obs || null]);
    }

    res.status(201).json({
      success: true,
      message: 'Solicitud de transferencia creada correctamente',
      data: {
        id: idTransferencia,
        almacen_origen,
        almacen_destino,
        estado: 'Pendiente'
      }
    });
  } catch (error) {
    console.error('Error al crear transferencia:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo crear la transferencia'
    });
  }
});

// Enviar mercancía (TRF-SAL)
router.post('/transferencias/:id/enviar', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { productos } = req.body;
    const usuario = req.user.username;

    // Obtener transferencia
    const transferencias = await query('SELECT * FROM transferencias WHERE id = ?', [id]);
    if (transferencias.length === 0) {
      return res.status(404).json({
        error: 'Transferencia no encontrada',
        message: 'No existe una transferencia con ese ID'
      });
    }

    const transferencia = transferencias[0];

    if (transferencia.estado !== 'Pendiente') {
      return res.status(400).json({
        error: 'Estado inválido',
        message: 'Solo se pueden enviar transferencias en estado Pendiente'
      });
    }

    // Validar stock y crear movimientos TRF-SAL
    const movimientos = [];
    for (const producto of productos) {
      const { id_producto, cantidad_enviada, lote } = producto;

      if (!id_producto || !cantidad_enviada || cantidad_enviada <= 0) {
        continue;
      }

      // Validar stock disponible
      const saldoActual = await obtenerSaldoActual(id_producto, transferencia.almacen_origen);
      if (saldoActual < cantidad_enviada) {
        return res.status(400).json({
          error: 'Stock insuficiente',
          message: `Producto ID ${id_producto}: Stock disponible: ${saldoActual}. Cantidad solicitada: ${cantidad_enviada}`,
          id_producto,
          stockActual: saldoActual,
          cantidadSolicitada: cantidad_enviada
        });
      }

      // Crear movimiento TRF-SAL
      const resultadoMovimiento = await query(`
        INSERT INTO movimientos_inventario (
          tipo, almacen, id_producto, cantidad, fecha, usuario, id_transferencia, lote
        ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?)
      `, ['TRF-SAL', transferencia.almacen_origen, id_producto, cantidad_enviada, usuario, id, lote || null]);

      const movimientoId = resultadoMovimiento.insertId;

      // Registrar en kardex
      await registrarKardex(
        id_producto,
        new Date(),
        transferencia.almacen_origen,
        movimientoId,
        'TRF-SAL',
        cantidad_enviada
      );

      // Actualizar detalle de transferencia
      await query(`
        UPDATE transferencias_detalle
        SET cantidad_enviada = ?
        WHERE id_transferencia = ? AND id_producto = ?
      `, [cantidad_enviada, id, id_producto]);

      movimientos.push({
        id_producto,
        cantidad_enviada,
        movimiento_id: movimientoId
      });
    }

    // Actualizar estado de transferencia
    await query(`
      UPDATE transferencias
      SET estado = 'En tránsito', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Mercancía enviada correctamente',
      data: {
        id_transferencia: id,
        estado: 'En tránsito',
        movimientos
      }
    });
  } catch (error) {
    console.error('Error al enviar mercancía:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo enviar la mercancía'
    });
  }
});

// Recibir mercancía (TRF-ENT)
router.post('/transferencias/:id/recibir', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { productos } = req.body;
    const usuario = req.user.username;

    // Obtener transferencia
    const transferencias = await query('SELECT * FROM transferencias WHERE id = ?', [id]);
    if (transferencias.length === 0) {
      return res.status(404).json({
        error: 'Transferencia no encontrada',
        message: 'No existe una transferencia con ese ID'
      });
    }

    const transferencia = transferencias[0];

    if (transferencia.estado !== 'En tránsito') {
      return res.status(400).json({
        error: 'Estado inválido',
        message: 'Solo se pueden recibir transferencias en estado En tránsito'
      });
    }

    // Crear movimientos TRF-ENT
    const movimientos = [];
    let todosRecibidos = true;

    for (const producto of productos) {
      const { id_producto, cantidad_recibida, lote, observaciones: obs } = producto;

      if (!id_producto || !cantidad_recibida || cantidad_recibida < 0) {
        continue;
      }

      // Obtener cantidad enviada
      const detalles = await query(`
        SELECT cantidad_enviada FROM transferencias_detalle
        WHERE id_transferencia = ? AND id_producto = ?
      `, [id, id_producto]);

      if (detalles.length === 0) {
        continue;
      }

      const cantidadEnviada = detalles[0].cantidad_enviada;

      // Crear movimiento TRF-ENT
      const resultadoMovimiento = await query(`
        INSERT INTO movimientos_inventario (
          tipo, almacen, id_producto, cantidad, fecha, usuario, id_transferencia, lote, nota
        ) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?)
      `, ['TRF-ENT', transferencia.almacen_destino, id_producto, cantidad_recibida, usuario, id, lote || null, obs || null]);

      const movimientoId = resultadoMovimiento.insertId;

      // Registrar en kardex
      await registrarKardex(
        id_producto,
        new Date(),
        transferencia.almacen_destino,
        movimientoId,
        'TRF-ENT',
        cantidad_recibida
      );

      // Actualizar detalle de transferencia
      await query(`
        UPDATE transferencias_detalle
        SET cantidad_recibida = ?, observaciones = ?
        WHERE id_transferencia = ? AND id_producto = ?
      `, [cantidad_recibida, obs || null, id, id_producto]);

      if (cantidad_recibida < cantidadEnviada) {
        todosRecibidos = false;
      }

      movimientos.push({
        id_producto,
        cantidad_recibida,
        movimiento_id: movimientoId
      });
    }

    // Actualizar estado de transferencia
    const nuevoEstado = todosRecibidos ? 'Recibida' : 'Recibida';
    await query(`
      UPDATE transferencias
      SET estado = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [nuevoEstado, id]);

    res.json({
      success: true,
      message: 'Mercancía recibida correctamente',
      data: {
        id_transferencia: id,
        estado: nuevoEstado,
        movimientos
      }
    });
  } catch (error) {
    console.error('Error al recibir mercancía:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo recibir la mercancía'
    });
  }
});

// Obtener transferencias
router.get('/transferencias', authenticateToken, async (req, res) => {
  try {
    const { almacen, estado } = req.query;

    let sql = `
      SELECT t.*,
             ao.nombre as origen_nombre,
             ad.nombre as destino_nombre
      FROM transferencias t
      LEFT JOIN almacenes ao ON t.almacen_origen = ao.codigo
      LEFT JOIN almacenes ad ON t.almacen_destino = ad.codigo
      WHERE 1=1
    `;
    const params = [];

    if (almacen) {
      sql += ' AND (t.almacen_origen = ? OR t.almacen_destino = ?)';
      params.push(almacen, almacen);
    }

    if (estado) {
      sql += ' AND t.estado = ?';
      params.push(estado);
    }

    sql += ' ORDER BY t.fecha_creada DESC LIMIT 200';

    const transferencias = await query(sql, params);

    res.json({
      success: true,
      data: transferencias,
      total: transferencias.length
    });
  } catch (error) {
    console.error('Error al obtener transferencias:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las transferencias'
    });
  }
});

// Obtener una transferencia con sus detalles
router.get('/transferencias/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const transferencias = await query(`
      SELECT t.*,
             ao.nombre as origen_nombre,
             ad.nombre as destino_nombre
      FROM transferencias t
      LEFT JOIN almacenes ao ON t.almacen_origen = ao.codigo
      LEFT JOIN almacenes ad ON t.almacen_destino = ad.codigo
      WHERE t.id = ?
    `, [id]);

    if (transferencias.length === 0) {
      return res.status(404).json({
        error: 'Transferencia no encontrada',
        message: 'No existe una transferencia con ese ID'
      });
    }

    const transferencia = transferencias[0];

    // Obtener detalles
    const detalles = await query(`
      SELECT td.*, p.item as producto_nombre, p.categoria as producto_categoria
      FROM transferencias_detalle td
      INNER JOIN productos p ON td.id_producto = p.id
      WHERE td.id_transferencia = ?
      ORDER BY td.id
    `, [id]);

    res.json({
      success: true,
      data: {
        ...transferencia,
        detalles
      }
    });
  } catch (error) {
    console.error('Error al obtener transferencia:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener la transferencia'
    });
  }
});

// Obtener transferencias pendientes de recibir para un almacén
router.get('/transferencias/pendientes/:almacen', authenticateToken, async (req, res) => {
  try {
    const { almacen } = req.params;

    const transferencias = await query(`
      SELECT t.*,
             ao.nombre as origen_nombre,
             ad.nombre as destino_nombre
      FROM transferencias t
      LEFT JOIN almacenes ao ON t.almacen_origen = ao.codigo
      LEFT JOIN almacenes ad ON t.almacen_destino = ad.codigo
      WHERE t.almacen_destino = ? AND t.estado = 'En tránsito'
      ORDER BY t.fecha_creada DESC
    `, [almacen]);

    res.json({
      success: true,
      data: transferencias
    });
  } catch (error) {
    console.error('Error al obtener transferencias pendientes:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las transferencias pendientes'
    });
  }
});

module.exports = router;
