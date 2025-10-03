// db.js
const mysql = require("mysql2");

const conexao = mysql.createConnection({
  host: process.env.DB_HOST, // host do Railway
  user: process.env.DB_USER, // usuário do Railway
  password: process.env.DB_PASS, // senha do Railway
  database: process.env.DB_NAME // nome do banco no Railway
});

conexao.connect((erro) => {
  if (erro) return console.log('❌ Erro na conexão:', erro.message);
  console.log('✅ Conexão bem-sucedida ao Railway!');
});

module.exports = conexao;