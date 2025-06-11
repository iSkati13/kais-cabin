document.addEventListener('DOMContentLoaded', () => {
  const galleryImages = [
    { src: "assets/images/resthouse.png", alt: "Resthouse Image 1" },
    { src: "assets/images/resthouse2.png", alt: "Resthouse Image 2" },
    { src: "assets/images/resthouse3.png", alt: "Resthouse Image 3" },
    // Add more images here!
  ];

  const slideshow = document.getElementById('gallerySlideshow');
  const dotsContainer = document.querySelector('.gallery__dots');
  if (!slideshow || !dotsContainer) return;

  slideshow.innerHTML = galleryImages.map((img, i) => `
    <div class="gallery__slide${i === 0 ? ' active' : ''}">
      <div class="gallery__holder">
        <img src="${img.src}" alt="${img.alt}" class="gallery__image">
      </div>
    </div>
  `).join('');

  dotsContainer.innerHTML = galleryImages.map((_, i) =>
    `<span class="gallery__dot${i === 0 ? ' active' : ''}" data-idx="${i}"></span>`
  ).join('');

  const slides = Array.from(slideshow.querySelectorAll('.gallery__slide'));
  const dots = Array.from(dotsContainer.querySelectorAll('.gallery__dot'));
  let current = 0;
  let timer;

  function showSlide(idx) {
    slides.forEach((slide, i) => {
      slide.classList.remove('active', 'prev', 'next');
      if (i === idx) slide.classList.add('active');
      else if (i === (idx - 1 + slides.length) % slides.length) slide.classList.add('prev');
      else if (i === (idx + 1) % slides.length) slide.classList.add('next');
    });
    dots.forEach(dot => dot.classList.remove('active'));
    dots[idx].classList.add('active');
    current = idx;
  }

  function nextSlide() {
    showSlide((current + 1) % slides.length);
  }

  function prevSlide() {
    showSlide((current - 1 + slides.length) % slides.length);
  }

  function startTimer() {
    timer = setInterval(nextSlide, 5000);
  }

  function resetTimer() {
    clearInterval(timer);
    startTimer();
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      showSlide(Number(dot.dataset.idx));
      resetTimer();
    });
  });

  document.querySelector('.gallery__btn--next')?.addEventListener('click', () => {
    nextSlide();
    resetTimer();
  });
  document.querySelector('.gallery__btn--prev')?.addEventListener('click', () => {
    prevSlide();
    resetTimer();
  });

  startTimer();
  showSlide(0);
});