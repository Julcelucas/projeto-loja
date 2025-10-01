// db.js
const mysql = require("mysql2");

const conexao = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "projecto",
  port: process.env.DB_PORT || 3306
});


conexao.connect((erro) => {
  if (erro) {
    console.error("❌ Erro na conexão:", erro.message);
  } else {
    console.log("✅ Conexão bem-sucedida ao MySQL!");
  }
});

module.exports = conexao;