// db.js
require("dotenv").config();
const mysql = require("mysql2");

let conexao;

if (process.env.DATABASE_URL) {
  conexao = mysql.createConnection(process.env.DATABASE_URL);
  console.log("🌐 Usando conexão com DATABASE_URL (Railway)");
} else {
  conexao = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
  });
  console.log("💻 Usando conexão local (localhost)");
}

// Teste de conexão
conexao.connect((erro) => {
  if (erro) {
    console.error("❌ Erro na conexão:", erro.message);
  } else {
    console.log("✅ Conexão bem-sucedida ao banco de dados!");
  }
});

module.exports = conexao;