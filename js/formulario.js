function listarCategoria(select) {
    const categoria = select.value
       const novaUrl = '/listar/' + categoria
   
       // Sempre redirecionar, independentemente da rota atual
       window.location.href = novaUrl
   }
   
     document.addEventListener("DOMContentLoaded", function () {
       const formulario = document.getElementById("formularioCadastro")
       const containerCards = document.getElementById("containerCards")
       const h2Cadastrar = document.getElementById("cadProduto")
       const url = window.location.href
   
       if (url.includes("/cadastro")) {
         formulario.style.display = "block"
         containerCards.style.display = "none"
       }
       
       if (url.includes("/listar")) {
         formulario.style.display = "none"
         containerCards.style.display = "block"
       }
       
        if (url.includes("/pesquisar")) {
         formulario.style.display = "none"
         containerCards.style.display = "block"
       }

       if (url.includes("/okCadastro")) {
         formulario.style.display = "block"
         containerCards.style.display = "none"
       }
   
       if (url.includes("/falhaCadastro")) {
         formulario.style.display = "block"
         containerCards.style.display = "none"
       }
   
      h2Cadastrar.addEventListener("click", function () {
         window.location.href = "/cadastro"
       })
     })