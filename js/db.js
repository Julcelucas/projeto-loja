// db.js
const mysql = require("mysql2");

const conexao = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "projecto"
});

conexao.connect((erro) => {
  if (erro) {
    console.error("❌ Erro na conexão:", erro.message);
  } else {
    console.log("✅ Conexão bem-sucedida ao MySQL!");
  }
});

module.exports = conexao;