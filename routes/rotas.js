const express = require('express');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs')
const transporter = require("../js/mailer")
const { validarNome, validarEmail, validarSenha, validarLogin } = require('../js/validacoesUsuario');
const { verificarLogin, verificarAdmin, registrarVisita } = require('../js/middlewares'); //
const {validarCodigoSecreto} = require("../app") 


const router = express.Router();

// ------------------------------
// Conexão com MySQL
// ------------------------------
const conexao = mysql.createConnection({
  host: process.env.DB_HOST, // host do Railway
  user: process.env.DB_USER, // usuário do Railway
  password: process.env.DB_PASS, // senha do Railway
  database: process.env.DB_NAME, // nome do banco no Railway
  port: process.env.DB_PORT
});

conexao.connect((erro) => {
  if (erro) return console.log('❌ Erro na conexão:', erro.message);
  console.log('✅ Conexão bem-sucedida ao Railway!');
});


// ------------------------------
// Rota principal (Home)
// ------------------------------
router.get('/', registrarVisita, (req, res) => {
    const usuario_id = 1;
    const sqlProdutos = "SELECT * FROM produtos ORDER BY codigo DESC";
    const sqlCarrinho = "SELECT SUM(quantidade) AS total FROM carrinho WHERE usuario_id = ?";
  
    conexao.query(sqlProdutos, (err, produtos) => {
      if (err) {
        console.log(err);
        return res.render('home', {
          layout: 'semLayout',
          titulo: 'Página Inicial',
          produtos: [],
          exibirHeader: true,
          exibirFooter: true,
          cartCount: 0
        });
      }
  
      conexao.query(sqlCarrinho, [usuario_id], (err2, resultado) => {
        const totalCarrinho = resultado?.[0]?.total || 0;
  
        res.render('home', {
          layout: 'semLayout',
          titulo: 'Página Inicial',
          produtos,
          exibirHeader: true,
          exibirFooter: true,
          cartCount: totalCarrinho // ✅ inicializa contador
        });
      });
    });
  });


//1. -------------------Pesquisa (formulario)------------------------//
router.get("/pesquisar", verificarLogin, (req, res) => {
    const termo = req.query.termo;

    if (!termo || termo.trim() === "") {
        return res.render("formulario", { mensagem: "Digite um termo para pesquisar" });
    }

    const sql = "SELECT * FROM produtos WHERE nome LIKE ?";
    conexao.query(sql, [`%${termo}%`], (erro, resultados) => {
        if (erro) {
            return res.send("Erro ao pesquisar: " + erro);
        }

        const mensagem = resultados.length === 0 ? "Produto não encontrado" : null;

        res.render("formulario", {
            produtos: resultados,
            mensagem
        });
    });
});


//2. ------------------------- Página de pesquisa (home)------------------------------// 
router.get("/pesquisa", (req, res) => {
  res.render("pesquisa", {
      layout: "semLayout",
      titulo: "Pesquisar Produtos",
      produtos: [] // 👉 vazio no carregamento inicial
  });
});


//3. ------------------------------- API de pesquisa (JSON)------------------------------//
router.get("/api/pesquisa", (req, res) => {
  const termo = req.query.termo;

  if (!termo || termo.trim() === "") {
      return res.json({
          erro: false,
          produtos: [],
          mensagem: "Digite algo para pesquisar"
      });
  }

  const sql = "SELECT * FROM produtos WHERE nome LIKE ?";
  conexao.query(sql, [`%${termo}%`], (erro, resultados) => {
      if (erro) {
          return res.json({
              erro: true,
              produtos: [],
              mensagem: "Erro na pesquisa"
          });
      }

      if (resultados.length === 0) {
          return res.json({
              erro: false,
              produtos: [],
              mensagem: "Produto não encontrado"
          });
      }

      res.json({
          erro: false,
          produtos: resultados
      });
  });
});


// 4.------------------------Cadastro de produtos------------------------------//
router.get('/cadastro', verificarLogin, (req, res) => {
  const situacao = req.session?.situacao || null;
  if (req.session) delete req.session.situacao;

  const sql = 'SELECT * FROM produtos ORDER BY RAND()';
  conexao.query(sql, (erro, retorno) => {
      res.render('formulario', { produtos: retorno, situacao });
  });
});

// 5. ---------------------Cadastrar----------------------------------//
router.post('/cadastrar', verificarLogin, (req, res) => {
  try {
      let nome = req.body.nome;
      let valor = req.body.valor;
      let imagem = req.files.imagem.name;
      let categoria = req.body.categoria;

      if (nome == '' || valor == '' || categoria == '' || isNaN(valor)) {
          return res.render("formulario", { situacao: "falhaCadastro" });
      }

      // SQL seguro usando placeholders
      let sql = "INSERT INTO produtos (nome, valor, imagem, categoria) VALUES (?, ?, ?, ?)";
      conexao.query(sql, [nome, valor, imagem, categoria], (erro) => {
          if (erro) throw erro;

          // mover imagem para a pasta
          req.files.imagem.mv(path.join(__dirname, '../imagens/', imagem));

          // sucesso
          res.render("formulario", { situacao: "okCadastro" });
      });
  } catch (erro) {
      res.render("formulario", { situacao: "falhaCadastro" });
  }
});



// 6. --------------------------Listar produtos (com categoria)------------------------------// 
router.get('/listar/:categoria', verificarLogin, (req, res) => {
    const categoria = req.params.categoria;

    let sql = '';
    if (categoria === 'todos') {
        sql = 'SELECT * FROM produtos ORDER BY RAND()';
    } else {
        sql = `SELECT * FROM produtos WHERE categoria = '${categoria}' ORDER BY nome ASC`;
    }

    conexao.query(sql, (erro, retorno) => {
        if (erro) throw erro;
        let mensagem = retorno.length === 0 ? 'Nenhum produto registrado com esta categoria' : null;

        res.render('formulario', {
            produtos: retorno,
            categoriaSelecionada: categoria,
            mensagem
        });
    });
});


// 7. ----------------------Filtrar por categoria (Home - links)---------------------------//
router.get("/produtos/categoria/:nome", (req, res) => {
  const usuario_id = 1;
  const categoria = req.params.nome;

  const sqlProdutos = "SELECT * FROM produtos WHERE categoria = ?";
  const sqlCarrinho = "SELECT SUM(quantidade) AS total FROM carrinho WHERE usuario_id = ?";

  conexao.query(sqlProdutos, [categoria], (erro, resultados) => {
    if (erro) {
      console.error("Erro ao buscar produtos:", erro);
      return res.render("categoriaProdutos", {
        layout: "semLayout",
        titulo: "Erro",
        mensagem: "Erro na pesquisa de categoria",
        exibirHeader: true,
        exibirFooter: false,
        cartCount: 0
      });
    }

    const categoriaFormatada = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    const vazio = resultados.length === 0;

    conexao.query(sqlCarrinho, [usuario_id], (err2, resultadoCarrinho) => {
      const totalCarrinho = resultadoCarrinho?.[0]?.total || 0;

      res.render("categoriaProdutos", {
        layout: "semLayout",
        titulo: "Produtos por Categoria",
        produtos: resultados,
        categoria: categoriaFormatada,
        vazio,
        exibirHeader: true,
        exibirFooter: false,
        cartCount: totalCarrinho // 👈 aqui o header já fica certo
      });
    });
  });
});


//8. -------------------------Editar produto------------------------------// 
router.get('/formularioEditar/:codigo', verificarLogin, (req, res) => {
    let sql = `SELECT * FROM produtos WHERE codigo = ${req.params.codigo}`;
    conexao.query(sql, (erro, retorno) => {
        if (erro) throw erro;
        res.render('formularioEditar', {
            produto: retorno[0],
            situacao: req.query.situacao
        });
    });
});

router.post('/editar', (req, res) => {
  let nome = req.body.nome;
  let valor = req.body.valor;
  let codigo = req.body.codigo;
  let nomeImagem = req.body.nomeImagem;
  let categoria = req.body.categoria;

  if (nome == '' || valor == '' || categoria == '' || isNaN(valor)) {
      return res.render('formularioEditar', {
          produto: { codigo, nome, valor, imagem: nomeImagem, categoria },
          situacao: 'falhaEdicao'
      });
  }

  if (req.files && req.files.imagem) {
      let imagem = req.files.imagem;
      let novoNome = imagem.name;

      let sql = `UPDATE produtos SET nome='${nome}', valor=${valor}, imagem='${novoNome}', categoria='${categoria}' WHERE codigo=${codigo}`;
      conexao.query(sql, () => {
          fs.unlink(path.join(__dirname, '../imagens/', nomeImagem), () => {});
          imagem.mv(path.join(__dirname, '../imagens/', novoNome), () => {
              // ⬇️ Aqui antes era redirect
              res.render("formularioEditar", {
                  produto: { codigo, nome, valor, imagem: novoNome, categoria },
                  situacao: "okEdicao"
              });
          });
      });

  } else {
      let sql = `UPDATE produtos SET nome='${nome}', valor=${valor}, categoria='${categoria}' WHERE codigo=${codigo}`;
      conexao.query(sql, () => {
          // ⬇️ Aqui também era redirect
          res.render("formularioEditar", {
              produto: { codigo, nome, valor, imagem: nomeImagem, categoria },
              situacao: "okEdicao"
          });
      });
  }
});

// 9. ---------------------------Remover produto ------------------------------//
router.get("/remover/:codigo/:imagem", verificarLogin, (req, res) => {
  const { codigo, imagem } = req.params;

  let sql = `DELETE FROM produtos WHERE codigo = ${codigo}`;
  conexao.query(sql, (erro) => {
    if (erro) {
      return res.redirect("/falhaRemover");
    }

    // 👉 Se quiser remover imagem do disco, ativa esse trecho
    // fs.unlink(path.join(__dirname, "../imagens/", imagem), (erro_imagem) => {
    // if (erro_imagem) console.log("⚠️ Erro ao remover imagem:", erro_imagem.message);
    // });

    res.redirect("/okRemover");
  });
});

// Página de sucesso ao remover ------------------------------
router.get("/okRemover", verificarLogin, (req, res) => {
  res.render("formulario", { situacao: "okRemover" });
});


// Página de falha ao remover ------------------------------
router.get("/falhaRemover", verificarLogin, (req, res) => {
  res.render("formulario", { situacao: "falhaRemover" });
});



// 10. ----------------------Adicionar produto ao carrinho------------------------------//
router.get("/carrinho/adicionar/:produto_id", (req, res) => {
    const usuario_id = 1; // futuramente via sessão
    const produto_id = req.params.produto_id;
  
    const sql = `
      INSERT INTO carrinho (produto_id, usuario_id, quantidade)
      VALUES (?, ?, 1)
      ON DUPLICATE KEY UPDATE quantidade = quantidade + 1
    `;
  
    conexao.query(sql, [produto_id, usuario_id], (err) => {
      if (err) {
        console.error("Erro ao adicionar no carrinho:", err);
        return res.json({ sucesso: false });
      }
  
      // 👉 buscar novo total do carrinho
      const sqlCount = "SELECT SUM(quantidade) AS total FROM carrinho WHERE usuario_id = ?";
      conexao.query(sqlCount, [usuario_id], (err2, resultado) => {
        if (err2) {
          console.error("Erro ao contar carrinho:", err2);
          return res.json({ sucesso: false });
        }
  
        const totalCarrinho = resultado[0]?.total || 0;
        res.json({ sucesso: true, cartCount: totalCarrinho });
      });
    });
  });


// 11. ----------------------Carrinho - Listar------------------------------//
router.get("/carrinho", (req, res) => {
    const usuario_id = 1;
  
    const sql = `
      SELECT c.id, c.quantidade, p.nome, p.valor, p.imagem, p.codigo
      FROM carrinho c
      JOIN produtos p ON c.produto_id = p.codigo
      WHERE c.usuario_id = ?
    `;
  
    conexao.query(sql, [usuario_id], (err, resultados) => {
      if (err) {
        console.error("Erro ao buscar carrinho:", err);
        return res.render("carrinho", {
          layout: "semLayout",
          produtosCarrinho: [],
          vazio: true,
          total: 0,
          cartCount: 0, // 👈 garante que header funciona
          exibirHeader: true
        });
      }
  
      // calcular total em dinheiro
      let total = 0;
      resultados.forEach(item => {
        total += item.valor * item.quantidade;
      });
  
      // calcular total de itens
      const cartCount = resultados.reduce((soma, item) => soma + item.quantidade, 0);
  
      res.render("carrinho", {
        layout: "semlayout",
        produtosCarrinho: resultados,
        vazio: resultados.length === 0,
        total,
        exibirHeader: true,
        cartCount // 👈 agora aparece no header
      });
    });
  });

// 12. --------------------------Atualizar quantidade (incrementar/decrementar)-----------//
router.post("/carrinho/atualizar/:id", (req, res) => {
  const id = req.params.id;
  const action = req.body.action;

  let sql;
  if (action === "increment") {
    sql = `UPDATE carrinho SET quantidade = quantidade + 1 WHERE id = ?`;
  } else if (action === "decrement") {
    sql = `UPDATE carrinho SET quantidade = GREATEST(quantidade - 1, 1) WHERE id = ?`;
  }

  conexao.query(sql, [id], (err) => {
    if (err) console.error(err);
    res.redirect("/carrinho");
  });
});

// 13. ---------------------Remover produto------------------------------//
router.post("/carrinho/remover/:id", (req, res) => {
  const id = req.params.id;
  conexao.query("DELETE FROM carrinho WHERE id = ?", [id], (err) => {
    if (err) console.error(err);
    res.redirect("/carrinho");
  });
});


// 14. ---------------------Finalizar compra pelo WhatsApp -------------------//
router.get("/carrinho/finalizar", (req, res) => {
  const usuario_id = 1;

  const sql = `
    SELECT c.quantidade, p.nome, p.valor
    FROM carrinho c
    JOIN produtos p ON c.produto_id = p.codigo
    WHERE c.usuario_id = ?
  `;

  conexao.query(sql, [usuario_id], (err, resultados) => {
    if (err || resultados.length === 0) {
      return res.redirect("/carrinho");
    }

    // Função para formatar valores em Kz igual ao front
    const formatarKwanza = (valor) =>
  valor
    .toLocaleString("pt-PT", { minimumFractionDigits: 2 })
    .replace(/\s/g, "."); // 👈 aqui resolve o espaço
      

    let mensagem = "🛒 Pedido de compra:%0A%0A";
    let total = 0;

    resultados.forEach((item) => {
      const subtotal = item.quantidade * item.valor;
      total += subtotal;
      mensagem += `• ${item.nome} (x${item.quantidade}) = ${formatarKwanza(
        subtotal
      )} AKZ%0A`;
    });

    mensagem += `%0A💰 Total: ${formatarKwanza(total)} AKZ%0A%0AObrigado!`;

    // 1️⃣ Registrar venda no banco
    const sqlVenda =
      "INSERT INTO vendas (usuario_id, valor_total, data_hora) VALUES (?, ?, NOW())";

    conexao.query(sqlVenda, [usuario_id, total], (err2, resultado) => {
      if (err2) {
        console.error("❌ Erro ao registrar venda:", err2);
        return res.redirect("/carrinho");
      }

      // 2️⃣ Limpar carrinho após registrar
      const sqlLimpar = "DELETE FROM carrinho WHERE usuario_id = ?";
      conexao.query(sqlLimpar, [usuario_id], (err3) => {
        if (err3) {
          console.error("❌ Erro ao limpar carrinho:", err3);
        }

        // 3️⃣ Redirecionar para WhatsApp
        const numero = "244946050178"; // teu número aqui
        res.redirect(
          `https://wa.me/${numero}?text=${mensagem}`
        );
      });
    });
  });
});




// -------------------------------------- Autenticação----------------------------//

// 15. ------------------------------ Login - GET------------------------------------//
router.get("/login", (req, res) => {
  // pega tanto de sessão quanto de query
  const situacao = req.session?.situacao || req.query.msg || null;

  // limpa flash
  if (req.session) delete req.session.situacao;

  res.render("login", {
    layout: "main",
    situacao,
    username: "",
    senha: ""
  });
});


// 16. ------------------------------Login - POST-----------------------------

router.post("/login", (req, res) => {
  const input = req.body.email || req.body.username;
  const senhaDigitada = req.body.senha;

  // ✅ Validação básica
  if (!input || !senhaDigitada) {
    req.session.situacao = "falhaLogin";
    return res.redirect("/login");
  }

  // ✅ Consulta pelo e-mail ou nome
  const sql = "SELECT * FROM usuarios WHERE email = ? OR nome = ?";
  conexao.query(sql, [input, input], (err, resultados) => {
    if (err) {
      console.error("❌ Erro MySQL (login):", err);
      req.session.situacao = "falhaLogin";
      return res.redirect("/login");
    }

    if (!resultados || resultados.length === 0) {
      console.log("❌ Nenhum usuário encontrado para:", input);
      req.session.situacao = "falhaLogin";
      return res.redirect("/login");
    }

    const usuario = resultados[0];

    // ✅ Verifica a senha com bcrypt
    const senhaValida = bcrypt.compareSync(senhaDigitada, usuario.senha);

    if (!senhaValida) {
      console.log("❌ Senha incorreta para usuário:", usuario.nome);
      req.session.situacao = "falhaLogin";
      return res.redirect("/login");
    }

    // ✅ Salva sessão
    req.session.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      tipo: usuario.tipo,
    };

    req.session.situacao = "okLogin";

    // ✅ Redireciona conforme o tipo de usuário
    if (usuario.tipo === "admin") {
      return res.redirect("/menuAdmin");
    } else {
      return res.redirect("/cadastro"); 
    }
  });
});



// 16.------------------------------Logout-------------------------------//

router.get("/logout", (req, res) => {
  // guarda flash antes de destruir a sessão
  const situacao = "okLogout";

  req.session.destroy(err => {
    if (err) {
      console.error("Erro ao encerrar sessão:", err);
      return res.redirect("/login");
    }

    // cria uma nova sessão e adiciona a mensagem
    res.redirect("/login?msg=" + situacao);
  });
});



// 17. ------------------------------ REGISTRAR - GET----------------------------//

router.get("/registrar", (req, res) => {
  res.render("registrar", {
    layout: "main",
    situacao: null,
    nome: "",
    email: "",
    senha: "",
    codigoSecreto: ""
  });
});

// 18. ------------------------------REGISTRAR - POST------------------------------//
router.post("/registrar", (req, res) => {
  const { nome, email, senha, confirmar, codigoSecreto } = req.body;

  // ------------------- Validações de campos ------------------- //
  if (!validarNome(nome)) {
    return res.render("registrar", { layout: "main", situacao: "falhaNome", nome: "", email: "", senha: "" });
  }

  if (!validarEmail(email)) {
    return res.render("registrar", { layout: "main", situacao: "falhaEmailFormato", nome: "", email: "", senha: "" });
  }

  if (!validarSenha(senha)) {
    return res.render("registrar", { layout: "main", situacao: "falhaSenhaComplexa", nome: "", email: "", senha: "" });
  }

  if (senha !== confirmar) {
    return res.render("registrar", { layout: "main", situacao: "falhaSenha", nome: "", email: "", senha: "" });
  }

  // ------------------- Validação do código secreto ------------------- //
  validarCodigoSecreto(codigoSecreto, (err, valido) => {
    if (err || !valido) {
      return res.render("registrar", { layout: "main", situacao: "falhaCodigo", nome, email, senha: "" });
    }

    // ------------------- Verifica se já existe usuário ------------------- //
    conexao.query("SELECT id FROM usuarios WHERE email = ?", [email], (err, rows) => {
      if (err) {
        console.error("Erro MySQL (verifica email):", err);
        return res.render("registrar", { layout: "main", situacao: "falhaRegistrar", nome: "", email: "", senha: "" });
      }

      if (rows.length > 0) {
        return res.render("registrar", { layout: "main", situacao: "falhaEmail", nome: "", email: "", senha: "" });
      }

      // ------------------- Gera hash da senha ------------------- //
      const hashSenha = bcrypt.hashSync(senha, 10);

      const sqlInserir = "INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, 'funcionario')";
      conexao.query(sqlInserir, [nome, email, hashSenha], (err2) => {
        if (err2) {
          console.error("Erro MySQL (inserir usuario):", err2);
          return res.render("registrar", { layout: "main", situacao: "falhaRegistrar", nome: "", email: "", senha: "" });
        }

        // ------------------- Sucesso ------------------- //
        return res.render("login", { layout: "main", situacao: "okUsuario", username: "", senha: "" });
      });
    });
  });
});





// 19. --------------------------Esqueceu senha - POST-------------------------------//
router.get("/esqueceu-senha", (req, res) => {
  const situacao = req.session.situacao;
  delete req.session.situacao;

  res.render("esqueceuSenha", {
    layout: "main",
    situacao
  });
});

// POST - envia código por e-mail
router.post("/esqueceu-senha", (req, res) => {
  const {email} = req.body;

  if (!validarEmail(email)) {
    return res.render("esqueceuSenha", { layout: "main", situacao: "falhaEmailFormato", email: "" });
  }

  // Verificar se usuário existe
  const sql = "SELECT id FROM usuarios WHERE email = ?";
  conexao.query(sql, [email], (erro, resultados) => {
    if (erro) {
      console.error("Erro na consulta:", erro);
      req.session.situacao = "erroDB";
      return res.redirect("/esqueceu-senha");
    }

    if (resultados.length === 0) {
      req.session.situacao = "emailNaoEncontrado";
      return res.redirect("/esqueceu-senha");
    }

    // Gerar código de 6 dígitos como string (mantém zeros à esquerda)
    const codigo = String(Math.floor(100000 + Math.random() * 900000)).padStart(6, "0");
    const expiracao = Date.now() + 10 * 60 * 1000; // expira em 10 min

    // Salvar código e expiração no banco
    const updateSql = "UPDATE usuarios SET codigoToken = ?, expiracaoToken = ? WHERE email = ?";
    conexao.query(updateSql, [codigo, expiracao, email], (updateErr) => {
      if (updateErr) {
        console.error("Erro ao salvar código no banco:", updateErr);
        req.session.situacao = "erroDB";
        return res.redirect("/esqueceu-senha");
      }

      // Guardar email na sessão (não precisa salvar código na sessão)
      req.session.emailRedefinir = email;

      // Configuração do e-mail
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Recuperação de Senha",
        text: `Seu código de redefinição é: ${codigo}. Ele expira em 10 minutos.`
      };

      // Enviar e-mail
      transporter.sendMail(mailOptions, (mailErr) => {
        if (mailErr) {
          console.error("Erro ao enviar e-mail:", mailErr);
          req.session.situacao = "falhaRedefinirSenha";
          return res.redirect("/esqueceu-senha");
        }

        req.session.situacao = "okEmailEnviado";
        return res.redirect("/confirmar-codigo");
      });
    });
  });
});


// GET - exibe formulário do código
router.get("/confirmar-codigo", (req, res) => {
  const situacao = req.session.situacao;
  delete req.session.situacao;

  if (!req.session.emailRedefinir) return res.redirect("/esqueceu-senha");

  res.render("confirmarCodigo", {
    layout: "main",
    situacao
  });
});

// POST - valida código
router.post("/confirmar-codigo", (req, res) => {
  const { codigo } = req.body;
  const email = req.session.emailRedefinir;

  if (!codigo || !email) {
    req.session.situacao = "falhaCodigoInvalido";
    return res.redirect("/confirmar-codigo");
  }

  const sql = "SELECT id, expiracaoToken FROM usuarios WHERE email = ? AND codigoToken = ?";
  conexao.query(sql, [email, codigo], (err, resultados) => {
    if (err || resultados.length === 0) {
      req.session.situacao = "falhaCodigoRedefinir";
      return res.redirect("/confirmar-codigo");
    }

    if (resultados[0].expiracaoToken < Date.now()) {
      req.session.situacao = "falhaTokenInvalido";
      return res.redirect("/confirmar-codigo");
    }

    req.session.usuarioRedefinir = resultados[0].id; // salva para nova senha
    req.session.situacao = "okCodigoValidado";
    return res.redirect(`/nova-senha/${resultados[0].id}`);
  });
});


// GET - exibe formulário nova senha
router.get("/nova-senha/:id", (req, res) => {
  const { id } = req.params;
  const situacao = req.session.situacao;
  delete req.session.situacao;

  res.render("novaSenha", {
    layout: "main",
    usuarioId: id, // <-- aqui mandas para o form
    situacao
  });
});


// POST - salva nova senha
router.post("/nova-senha/:id", (req, res) => {
  const { senha, confirmarSenha } = req.body;
  const usuarioId = req.session.usuarioRedefinir;
  const idParam = req.params.id;

  // verifica se usuário da sessão é o mesmo do parâmetro
  if (!usuarioId || usuarioId != idParam) {
    return res.render("novaSenha", { layout: "main", situacao: "falhaRedefinirSenha", usuarioId });
  }

  // validação de senha
  if (!validarSenha(senha)) {
    return res.render("novaSenha", { layout: "main", situacao: "falhaSenhaComplexa", usuarioId });
  }
  if (senha !== confirmarSenha) {
    return res.render("novaSenha", { layout: "main", situacao: "falhaSenha", usuarioId });
  }
  // Criptografar senha
  const hash = bcrypt.hashSync(senha, 10);

  const sql = "UPDATE usuarios SET senha = ?, codigoToken = NULL, expiracaoToken = NULL WHERE id = ?";
  conexao.query(sql, [hash, usuarioId], (err) => {
    if (err) {
      console.error(err);
      req.session.situacao = "falhaRedefinirSenha";
      return res.redirect(`/nova-senha/${usuarioId}`);
    }

    // Limpar sessão
    delete req.session.usuarioRedefinir;
    delete req.session.emailRedefinir;

    req.session.situacao = "okSenhaRedefinida";
    return res.redirect("/login");
  });
});



// 20. -----------------------Menu Admin -----------------------------------------//
router.get("/menuAdmin", verificarAdmin, (req, res) => {
  const situacao = req.session?.situacao || null;
  if (req.session) delete req.session.situacao;

  res.render("menuAdmin", { layout: "main", situacao });
});


// 21------------------------------ Dashboard -------------------------------------//
router.get("/dashboard", verificarAdmin, (req, res) => {
  const situacao = req.session.situacao; // Captura a mensagem da sessão
  delete req.session.situacao; // Limpa a sessão para a próxima vez

  const sqlProdutos = "SELECT COUNT(*) AS totalProdutos FROM produtos";
  const sqlFuncionarios = "SELECT COUNT(*) AS totalFuncionarios FROM usuarios";
  const sqlVendas = "SELECT COUNT(*) AS totalVendas FROM vendas";
  const sqlVisitas = "SELECT COUNT(*) AS totalVisitas FROM visitas";
  const sqlUltimasVendas = `
    SELECT id, valor_total, data_hora 
    FROM vendas 
    ORDER BY data_hora DESC 
    LIMIT 10
  `;
  const sqlFuncionariosLista = "SELECT id, nome, email, senha FROM usuarios";

  Promise.all([
    new Promise((resolve, reject) => {
      conexao.query(sqlProdutos, (err, result) => {
        if (err) return reject(err);
        resolve(result[0]?.totalProdutos || 0);
      });
    }),
    new Promise((resolve, reject) => {
      conexao.query(sqlFuncionarios, (err, result) => {
        if (err) return reject(err);
        resolve(result[0]?.totalFuncionarios || 0);
      });
    }),
    new Promise((resolve, reject) => {
      conexao.query(sqlVendas, (err, result) => {
        if (err) return reject(err);
        resolve(result[0]?.totalVendas || 0);
      });
    }),
    new Promise((resolve, reject) => {
      conexao.query(sqlVisitas, (err, result) => {
        if (err) return reject(err);
        resolve(result[0]?.totalVisitas || 0);
      });
    }),
    new Promise((resolve, reject) => {
      conexao.query(sqlUltimasVendas, (err, result) => {
        if (err) return reject(err);
        resolve(result || []);
      });
    }),
    new Promise((resolve, reject) => {
      conexao.query(sqlFuncionariosLista, (err, result) => {
        if (err) return reject(err);
        resolve(result || []);
      });
    })
  ])
    .then(([totalProdutos, totalFuncionarios, totalVendas, totalVisitas, vendas, funcionarios]) => {
      res.render("dashboard", {
        layout: "main",
        totalProdutos,
        totalFuncionarios,
        totalVendas,
        totalVisitas,
        vendas,
        funcionarios,
        situacao
      });
    })
    .catch(err => {
      console.error("Erro ao carregar dashboard:", err);
      res.render("dashboard", {
        layout: "main",
        totalProdutos: 0,
        totalFuncionarios: 0,
        totalVendas: 0,
        totalVisitas: 0,
        vendas: [],
        funcionarios: [],
        situacao
      });
    });
});




// ------------------------------
// Formulário de edição de funcionário
// ------------------------------
router.get("/funcionarios/editar/:id", verificarAdmin, (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM usuarios WHERE id = ?";

  const situacao = req.session.situacao; // pega a msg da sessão
  delete req.session.situacao; // apaga depois de usar

  conexao.query(sql, [id], (err, resultado) => {
    if (err || resultado.length === 0) {
      console.error("Erro ao buscar funcionário:", err);
      req.session.situacao = "falhaRegistrar";
      return res.redirect("/dashboard");
    }

    res.render("formularioEditarFuncionario", {
      layout: "main",
      funcionario: resultado[0],
      situacao, // 👈 mensagem vinda da sessão
      contexto: "formularioFuncionario" // 👈 garante que cai no bloco certo
    });
  });
});

// ------------------------------
// Salvar edição de funcionário
// ------------------------------
router.post("/funcionarios/editar/:id", verificarAdmin, (req, res) => {
  const { nome, email, senha, confirmarSenha } = req.body;
  const { id } = req.params;

  // Validação do nome
  if (!validarNome(nome)) {
    req.session.situacao = "falhaNome";
    return res.redirect("/funcionarios/editar/" + id);
  }

  // Validação do email
  if (!validarEmail(email)) {
    req.session.situacao = "falhaEmailFormato";
    return res.redirect("/funcionarios/editar/" + id);
  }

  // Validação da senha (somente se preenchida)
  let novaSenha = null;
  if (senha.trim() !== "") {
    if (!validarSenha(senha)) {
      req.session.situacao = "falhaSenhaComplexa";
      return res.redirect("/funcionarios/editar/" + id);
    }
    if (senha !== confirmarSenha) {
      req.session.situacao = "falhaSenhaFuncionario";
      return res.redirect("/funcionarios/editar/" + id);
    }
    novaSenha = bcrypt.hashSync(senha, 10); // gera hash se houver alteração
  }

  // Se a senha não foi alterada, busca a atual
  const sqlBuscar = "SELECT senha FROM usuarios WHERE id = ?";
  conexao.query(sqlBuscar, [id], (err, resultado) => {
    if (err || resultado.length === 0) {
      console.error("Erro ao buscar funcionário:", err);
      req.session.situacao = "falhaRegistrar";
      return res.redirect("/dashboard");
    }

    if (!novaSenha) novaSenha = resultado[0].senha;

    // Atualiza funcionário
    const sqlUpdate = "UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?";
    conexao.query(sqlUpdate, [nome, email, novaSenha, id], (erro) => {
      if (erro) {
        console.error("Erro ao editar funcionário:", erro);
        req.session.situacao = "falhaEdicaoFuncionario";
        return res.redirect("/funcionarios/editar/" + id);
      } else {
        req.session.situacao = "okEdicaoFuncionario";
        return res.redirect("/dashboard");
      }
    });
  });
});


// ------------------------------
// Excluir funcionário
// ------------------------------
router.get("/funcionarios/remover/:id", verificarAdmin, (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM usuarios WHERE id = ?";
  conexao.query(sql, [id], (err) => {
    if (err) {
      console.error("Erro ao excluir funcionário:", err);
      req.session.situacao = "falhaRemoverFuncionario";
    } else {
      req.session.situacao = "okRemoverFuncionario";
    }
    return res.redirect("/dashboard");
  });
});


// ------------------------------
// Exportar as rotas
// ------------------------------
module.exports = router;
