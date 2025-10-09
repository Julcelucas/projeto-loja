// db.js
require("dotenv").config();
const mysql = require("mysql2");

let conexao;

function conectarBanco() {
  if (process.env.DATABASE_URL) {
    conexao = mysql.createConnection(process.env.DATABASE_URL);
    console.log("🌐 Usando conexão com DATABASE_URL (Railway)");
  } else {
    conexao = mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
    console.log("💻 Usando conexão local (localhost)");
  }

  conexao.connect((erro) => {
    if (erro) {
      console.error("❌ Erro na conexão:", erro.message);
      setTimeout(conectarBanco, 2000); // tenta reconectar em 2 segundos
    } else {
      console.log("✅ Conexão bem-sucedida ao banco de dados!");
    }
  });

  // Quando o Railway fechar a conexão, reconecta automaticamente
  conexao.on('error', (erro) => {
    console.error('⚠️ Erro de conexão MySQL:', erro.code);
    if (erro.code === 'PROTOCOL_CONNECTION_LOST' || erro.fatal) {
      console.log('🔁 Tentando reconectar ao banco...');
      conectarBanco();
    } else {
      throw erro;
    }
  });
}

conectarBanco();


module.exports = conexao;