// middlewares.js
const conexao = require("./db"); // ✅ importa a conexão

function verificarLogin(req, res, next) {
  if (!req.session.usuario) {
    return res.redirect("/login?msg=erroAutenticacao");
  }
  next();
}

function verificarAdmin(req, res, next) {
  if (!req.session.usuario || req.session.usuario.tipo !== "admin") {
    return res.redirect("/login?msg=erroAutenticacao");
  }
  next();
}

// Middleware para registrar visita
function registrarVisita(req, res, next) {
  const sql = "INSERT INTO visitas (data_hora) VALUES (NOW())";
  conexao.query(sql, (err) => {
    if (err) console.error("Erro ao registrar visita:", err);
    next(); // continua normalmente
  });
}

module.exports = { verificarLogin, verificarAdmin, registrarVisita };
