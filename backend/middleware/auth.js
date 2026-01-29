const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token no proporcionado',
      message: 'Se requiere autenticación'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pharmavel_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      error: 'Token inválido',
      message: 'El token de autenticación no es válido'
    });
  }
};

module.exports = { authenticateToken };
