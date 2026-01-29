const mysql = require('mysql2/promise');

let pool = null;

const createPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || '10.0.0.3',
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME || 'pharmavelbd',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    console.log('✅ Pool de conexiones MySQL creado');
  }
  return pool;
};

const query = async (sql, params = []) => {
  const poolInstance = createPool();
  try {
    const [results] = await poolInstance.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error en query:', error.message);
    throw error;
  }
};

const testConnection = async () => {
  try {
    const poolInstance = createPool();
    await poolInstance.execute('SELECT 1');
    console.log('✅ Conexión a MySQL establecida');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    return false;
  }
};

module.exports = {
  query,
  testConnection,
  createPool
};