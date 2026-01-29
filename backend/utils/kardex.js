const { query } = require('../config/database');

// Función para obtener el saldo actual de un producto en un almacén
const obtenerSaldoActual = async (idProducto, almacen) => {
  try {
    const resultado = await query(`
      SELECT saldo_resultante 
      FROM kardex 
      WHERE id_producto = ? AND almacen = ?
      ORDER BY fecha DESC, id DESC
      LIMIT 1
    `, [idProducto, almacen]);

    return resultado.length > 0 ? resultado[0].saldo_resultante : 0;
  } catch (error) {
    console.error('Error al obtener saldo actual:', error);
    return 0;
  }
};

// Función para formatear fecha para MySQL
const formatearFechaMySQL = (fecha) => {
  if (!fecha) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  if (typeof fecha === 'string') {
    // Si viene como ISO string, convertir
    if (fecha.includes('T')) {
      return fecha.slice(0, 19).replace('T', ' ');
    }
    // Si ya está en formato MySQL, retornar tal cual
    return fecha;
  }
  // Si es un objeto Date
  return fecha.toISOString().slice(0, 19).replace('T', ' ');
};

// Función para registrar movimiento en kardex
const registrarKardex = async (idProducto, fecha, almacen, movimientoId, tipoMovimiento, cantidad) => {
  try {
    const saldoAnterior = await obtenerSaldoActual(idProducto, almacen);
    
    let saldoResultante;
    if (tipoMovimiento === 'INGRESO' || tipoMovimiento === 'TRF-ENT') {
      saldoResultante = saldoAnterior + cantidad;
    } else if (tipoMovimiento === 'EGRESO' || tipoMovimiento === 'TRF-SAL') {
      saldoResultante = saldoAnterior - cantidad;
    } else {
      saldoResultante = saldoAnterior;
    }

    const fechaFormateada = formatearFechaMySQL(fecha);

    await query(`
      INSERT INTO kardex (
        id_producto, fecha, almacen, movimiento_id, tipo_movimiento, cantidad, saldo_resultante
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [idProducto, fechaFormateada, almacen, movimientoId, tipoMovimiento, cantidad, saldoResultante]);

    return saldoResultante;
  } catch (error) {
    console.error('Error al registrar kardex:', error);
    throw error;
  }
};

// Función para obtener kardex de un producto en un almacén
const obtenerKardex = async (idProducto, almacen, fechaInicio = null, fechaFin = null) => {
  try {
    let sql = `
      SELECT k.*, p.item as producto_nombre
      FROM kardex k
      INNER JOIN productos p ON k.id_producto = p.id
      WHERE k.id_producto = ? AND k.almacen = ?
    `;
    const params = [idProducto, almacen];

    if (fechaInicio) {
      sql += ' AND k.fecha >= ?';
      params.push(fechaInicio);
    }
    if (fechaFin) {
      sql += ' AND k.fecha <= ?';
      params.push(fechaFin);
    }

    sql += ' ORDER BY k.fecha DESC, k.id DESC';

    const kardex = await query(sql, params);
    return kardex;
  } catch (error) {
    console.error('Error al obtener kardex:', error);
    throw error;
  }
};

module.exports = {
  obtenerSaldoActual,
  registrarKardex,
  obtenerKardex
};
