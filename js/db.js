// db.js
require("dotenv").config();
const mysql = require("mysql2");

let pool;

if (process.env.DATABASE_URL) {
  pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log("🌐 Usando pool de conexões com DATABASE_URL (Railway)");
} else {
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
  console.log("💻 Usando pool de conexões local (localhost)");
}

const conexao = pool.promise();

// Teste de conexão
(async () => {
  try {
    const [rows] = await conexao.query('SELECT 1');
    console.log('✅ Conexão bem-sucedida ao banco de dados!');
  } catch (erro) {
    console.error('❌ Erro na conexão:', erro.message);
  }
})();


module.exports = conexao;