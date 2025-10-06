// Importar os módulos
const express = require('express');
const fileupload = require('express-fileupload');
const exphbs = require('express-handlebars');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
require("dotenv").config();
const nodemailer = require("nodemailer");
const conexao = require("./js/db"); // ✅ importa a conexão
const bcrypt = require('bcryptjs');

// Criar a aplicação
const app = express();

// Registrar helpers personalizados do Handlebars
const hbs = exphbs.create({
  helpers: {
    condicionalIgualdade: function (a, b, options) {
      if (options && typeof options.fn === "function") {
        return a === b ? options.fn(this) : options.inverse(this);
      }
      return a === b;
    },
    eq: function (a, b) {
      return a === b;
    },
    formatarKwanza: function (valor) {
      if (typeof valor !== "number") valor = parseFloat(valor) || 0;
      return valor.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  }
});

// Configuração global do Nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Testa a conexão SMTP
transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Erro SMTP:", err);
  } else {
    console.log("✅ Servidor SMTP pronto para enviar e-mails.");
  }
});

// Configuração do Handlebars como template engine
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');

// Habilitar o uso de arquivos estáticos
app.use('/bootstrap', express.static('./node_modules/bootstrap/dist'));
app.use('/js', express.static('./js'));
app.use('/css', express.static('./css'));
app.use('/imagens', express.static('./imagens'));

// Habilitar o upload de arquivos
app.use(fileupload());

// Habilitar o processamento de dados de formulários
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware para o ano atual no footer
app.use((req, res, next) => {
  res.locals.year = new Date().getFullYear();
  next();
});

// Configuração de sessão
app.use(session({
  secret: "segredo_super_seguranca",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hora
}));

// ================================
// Executar o init.sql ao iniciar
// ================================
const initPath = path.join(__dirname, 'init.sql');

if (fs.existsSync(initPath)) {
  console.log("🔍 Executando script init.sql...");

  const initSql = fs.readFileSync(initPath, 'utf8');
  const comandos = initSql
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0);

  comandos.forEach(sql => {
    conexao.query(sql, (err) => {
      if (err) {
        console.error("❌ Erro ao executar comando:", err.message);
      } else {
        console.log("✅ Comando executado:", sql.split('\n')[0]);
      }
    });
  });
} else {
  console.log("⚠️ Arquivo init.sql não encontrado. Nenhuma tabela criada.");
}

// ================================
// Criar admin padrão
// ================================
function criarAdmin() {
  const emailAdmin = "admin@gmail.com";
  const senhaCriptografada = "$2b$10$O5zG/8SosA.hXnFXg0b29Ob6faMrH2i.FYElH7KPsD8lcBGtDOoYy";
  const nomeAdmin = "Administrador";
  const tipoAdmin = "admin";

  const sqlCheck = "SELECT * FROM usuarios WHERE email = ? AND nome = ?";
  conexao.query(sqlCheck, [emailAdmin, nomeAdmin], (erro, resultados) => {
    if (erro) {
      console.error("❌ Erro ao verificar admin:", erro);
      return;
    }

    if (resultados.length === 0) {
      const sqlInsert = `
        INSERT INTO usuarios (id, nome, email, senha, tipo)
        VALUES (1, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nome = VALUES(nome),
          email = VALUES(email),
          senha = VALUES(senha),
          tipo = VALUES(tipo)
      `;
      conexao.query(
        sqlInsert,
        [nomeAdmin, emailAdmin, senhaCriptografada, tipoAdmin],
        (erro2) => {
          if (erro2) {
            console.error("❌ Erro ao criar admin:", erro2);
          } else {
            console.log("✅ Usuário admin criado/atualizado com sucesso!");
          }
        }
      );
    } else {
      console.log("ℹ️ Admin já existe, nada a fazer.");
    }
  });
}

// Chama a função ao iniciar o app
criarAdmin();

// ================================
// Código secreto
// ================================
const HASH_CODIGO_SECRETO_FUNCIONARIO = "$2b$10$TzoSQEAiMm.JUzsCoFHbtudMhbXIslKN1RlXGjyfy.FpV688er8qe";

function criarCodigoSecreto() {
  const sqlCheck = "SELECT id FROM codigo_secreto LIMIT 1";
  conexao.query(sqlCheck, (err, results) => {
    if (err) {
      console.error("Erro ao verificar código secreto:", err);
      return;
    }

    if (results.length === 0) {
      const sqlInsert = "INSERT INTO codigo_secreto (hash, ativo) VALUES (?, TRUE)";
      conexao.query(sqlInsert, [HASH_CODIGO_SECRETO_FUNCIONARIO], (err2) => {
        if (err2) {
          console.error("Erro ao inserir código secreto:", err2);
        } else {
          console.log("✅ Código secreto inicial inserido no banco.");
        }
      });
    } else {
      console.log("ℹ️ Código secreto já existe na tabela.");
    }
  });
}

// Chama a função ao iniciar o app
criarCodigoSecreto();

// Função para validar o código secreto
function validarCodigoSecreto(codigo, callback) {
  const sql = "SELECT hash FROM codigo_secreto WHERE ativo = TRUE LIMIT 1";
  conexao.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar código secreto no banco:", err);
      const bcrypt = require('bcryptjs');
      return callback(null, bcrypt.compareSync(codigo, HASH_CODIGO_SECRETO_FUNCIONARIO));
    }

    const bcrypt = require('bcryptjs');
    if (results.length === 0) {
      return callback(null, bcrypt.compareSync(codigo, HASH_CODIGO_SECRETO_FUNCIONARIO));
    }

    const hashAtivo = results[0].hash;
    const valido = bcrypt.compareSync(codigo, hashAtivo);
    callback(null, valido);
  });
}

module.exports = { validarCodigoSecreto };

// ================================
// Importar e usar rotas
// ================================
const rotas = require('./routes/rotas');
app.use('/', rotas);

// Exporta o transporter para uso em outras rotas
module.exports = transporter;

// ================================
// Iniciar servidor
// ================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
