 //---------------------Script para esconder loading ---------------//
 document.addEventListener("DOMContentLoaded", () => {
  const loading = document.getElementById("loading");

  // Esconde o loading e mostra o conteúdo
  window.addEventListener("load", () => {
    loading.style.display = "none";
  });
});


var swiper = new Swiper(".mySwiper", {
    spaceBetween: 30,
    centeredSlides: true,
    autoplay: {
      delay: 4500,
      disableOnInteraction: false,
    },
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
  });


  var swiper_2 = new Swiper(".mySwiper_2", {
    slidesPerView: 2,
    spaceBetween: 30,
    pagination: {
      el: ".swiper-pagination-2",
      clickable: true,
    },
    navigation: {
      nextEl: ".swiper-button-next-2",
      prevEl: ".swiper-button-prev-2",
    },
  });

  
  const cardsPerSlide = 9;
  const container = document.getElementById("cards-container");
  const cards = Array.from(container.querySelectorAll(".card"));

  // limpar o container (vamos recriar slides dentro dele)
  container.innerHTML = "";

  // agrupar os cards em blocos de 10
  for (let i = 0; i < cards.length; i += cardsPerSlide) {
    const slide = document.createElement("div");
    slide.classList.add("swiper-slide");

    // pegar até 10 cards por vez
    const group = cards.slice(i, i + cardsPerSlide);
    group.forEach(card => slide.appendChild(card));

    // adicionar o slide na swiper-wrapper
    container.appendChild(slide);
  }

  // inicializar swiper
  var swiper3 = new Swiper(".mySwiper_3", {
    loop: false,
    navigation: {
      nextEl: ".swiper-button-next-3",
      prevEl: ".swiper-button-prev-3",
    },
    slidesPerView: 1,
    spaceBetween: 30,
    pagination: {
      el: ".swiper-pagination-3",
      type: "fraction",
    },
  });




  
