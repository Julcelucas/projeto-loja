// db.js
require("dotenv").config();
const mysql = require("mysql2");

const isRemote = !!process.env.DATABASE_URL;

// Cria pool de conexões
const conexao = mysql.createPool({
  uri: isRemote ? process.env.DATABASE_URL : undefined,
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "projecto",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10, // máximo de conexões simultâneas
  queueLimit: 0, // 0 = fila infinita
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
});

// Teste de conexão
conexao.getConnection((erro, conn) => {
  if (erro) {
    console.error("❌ Erro na conexão com o banco:", erro.message);
  } else {
    console.log("✅ Conexão bem-sucedida ao banco de dados!");
    conn.release(); // devolve a conexão ao pool
  }
});

module.exports = conexao;