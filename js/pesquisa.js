document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const searchAction = document.getElementById("searchAction");
  const resultsContainer = document.getElementById("results-container");
  const mensagensContainer = document.getElementById("mensagens-container");

  if (!searchInput || !searchAction) return;

  // Atualizar ícone conforme digitação
  searchInput.addEventListener("input", () => {
    if (searchInput.value.trim().length > 0) {
      searchAction.textContent = "close"; 
      searchAction.classList.add("close-active");
    } else {
      searchAction.textContent = "search"; 
      searchAction.classList.remove("close-active");
    }
  });

  // Função de pesquisa via AJAX
  async function executarPesquisa() {
    const termo = searchInput.value.trim();
    if (!termo) return;

    try {
      const resposta = await fetch(`/api/pesquisa?termo=${encodeURIComponent(termo)}`);
      const dados = await resposta.json();

      resultsContainer.innerHTML = "";
      mensagensContainer.innerHTML = "";

      if (dados.mensagem) {
        mensagensContainer.innerHTML = `
          <div class="alert alert-warning text-center">
            ${dados.mensagem}
          </div>
        `;
      } else {
        resultsContainer.innerHTML = dados.produtos.map(p => `
          <div class="card card-search">
            <div class="card-image">
              <img src="/imagens/${p.imagem}" alt="${p.nome}">
            </div>
            <div class="card-content">
              <h3 class="product-name">${p.nome}</h3>
              <div class="product-rating">★★★★☆</div>
              <div class="product-price">${new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA" }).format(p.valor)}</div>
              <a href="/carrinho/adicionar/${p.codigo}" 
                 class="btn-buy adicionar-carrinho" 
                 data-id="${p.codigo}">
                 Adicionar ao Carrinho
              </a>
            </div>
          </div>
        `).join("");
      }

    } catch (err) {
      console.error("Erro na pesquisa:", err);
      mensagensContainer.innerHTML = `
        <div class="alert alert-danger text-center">
          Erro ao realizar pesquisa
        </div>
      `;
    }
  }

  // Clique no ícone de lupa/X
  searchAction.addEventListener("click", () => {
    if (searchAction.textContent === "close") {
      searchInput.value = "";
      searchAction.textContent = "search";
      searchAction.classList.remove("close-active");
      resultsContainer.innerHTML = "";
      mensagensContainer.innerHTML = "";
    } else {
      executarPesquisa();
    }
  });

  // Enter no input
  searchInput.addEventListener("keydown", e => {
    if (e.key === "Enter") executarPesquisa();
  });

  // Botão de voltar
  const closeBtn = document.getElementById("closeOverlay");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      window.location.href = "/";
    });
  }
});
