const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Credenciales incompletas',
        message: 'Debe proporcionar usuario y contraseña'
      });
    }

    const users = await query(
      'SELECT id, username, password, nombre, rol FROM usuarios WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos'
      });
    }

    const user = users[0];

    let passwordValid = false;
    
    if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
      passwordValid = await bcrypt.compare(password, user.password);
    } else {
      passwordValid = password === user.password;
      
      if (passwordValid) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await query('UPDATE usuarios SET password = ? WHERE id = ?', [hashedPassword, user.id]);
      }
    }

    if (!passwordValid) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos'
      });
    }

    const token = jwt.sign(
      { 
        id: user.id,
        username: user.username,
        role: user.rol || 'user'
      },
      process.env.JWT_SECRET || 'pharmavel_secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.nombre || user.username,
        role: user.rol || 'user'
      },
      message: 'Inicio de sesión exitoso'
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al procesar la solicitud'
    });
  }
});

module.exports = router;