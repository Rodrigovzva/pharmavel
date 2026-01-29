const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Obtener todos los almacenes
router.get('/almacenes', authenticateToken, async (req, res) => {
  try {
    const almacenes = await query('SELECT * FROM almacenes WHERE activo = 1 ORDER BY codigo');
    res.json({
      success: true,
      data: almacenes
    });
  } catch (error) {
    console.error('Error al obtener almacenes:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los almacenes'
    });
  }
});

// Obtener un almacén por código
router.get('/almacenes/:codigo', authenticateToken, async (req, res) => {
  try {
    const { codigo } = req.params;
    const almacenes = await query('SELECT * FROM almacenes WHERE codigo = ? AND activo = 1', [codigo]);
    
    if (almacenes.length === 0) {
      return res.status(404).json({
        error: 'Almacén no encontrado',
        message: 'No existe un almacén con ese código'
      });
    }

    res.json({
      success: true,
      data: almacenes[0]
    });
  } catch (error) {
    console.error('Error al obtener almacén:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo obtener el almacén'
    });
  }
});

module.exports = router;
