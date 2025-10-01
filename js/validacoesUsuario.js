// Valida se o nome tem pelo menos uma letra maiúscula
function validarNome(nome) {
    const regex = /[A-Z]/;
    return typeof nome === "string" && regex.test(nome) && nome.trim().length > 0;
}

// Valida se o email contém '@' e formato básico
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === "string" && regex.test(email);
}

// Valida se a senha tem letras, números e caracteres especiais
function validarSenha(senha) {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;
    return typeof senha === "string" && regex.test(senha);
}

function validarLogin(email, senha) {
    const erros = [];
  
    if (!email || !senha) {
      erros.push("Preencha todos os campos!");
    } else if (!validarEmail(email)) {
      erros.push("Formato de e-mail inválido!");
    }
  
    return erros;
  }

module.exports = {
    validarNome,
    validarEmail,
    validarSenha,
    validarLogin 
};
