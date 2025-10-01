document.addEventListener("DOMContentLoaded", () => {
  const contador = document.getElementById("cart-count"); // garante que exista

  // Delegação de evento para todos os elementos .adicionar-carrinho
  document.addEventListener("click", async (e) => {
    const link = e.target.closest(".adicionar-carrinho");
    if (!link) return;

    e.preventDefault();

    const produtoId = link.dataset.id;
    if (!produtoId) return console.error("Produto ID não encontrado!");

    try {
      const resposta = await fetch(`/carrinho/adicionar/${produtoId}`);
      const dados = await resposta.json();

      if (dados.sucesso) {
        if (contador) contador.textContent = dados.cartCount;
        window.location.href = "/carrinho"; // redireciona para o carrinho
      } else {
        console.error("Erro ao adicionar produto ao carrinho", dados);
      }

    } catch (err) {
      console.error("Erro na requisição:", err);
    }
  });
});
