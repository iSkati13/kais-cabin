const amenitiesData = [
  {
    category: "Outdoor",
    items: [
      { icon: "pool.png", label: "Adult Pool", desc: "Relax and swim in our spacious pool." },
      { icon: "playground.png", label: "Play/Open Area", desc: "Wide space for games and fun." },
      { icon: "furniture.png", label: "Outdoor Furnitures", desc: "Chill with comfy outdoor seats." },
      { icon: "camera.png", label: "Insta Spots", desc: "Perfect corners for your IG feed." },
      { icon: "bbq.png", label: "Outdoor BBQ", desc: "Grill and dine al fresco." }
    ]
  },
  {
    category: "Kitchen",
    items: [
      { icon: "utensils.png", label: "Kitchen Utensils", desc: "Cookware and tableware provided." },
      { icon: "fridge.png", label: "Refrigerator", desc: "Keep your food and drinks cool." },
      { icon: "microwave.png", label: "Microwave Oven", desc: "Heat up meals anytime." },
      { icon: "kettle.png", label: "Electric Kettle", desc: "Hot water on demand." },
      { icon: "stove.png", label: "Gas/Induction Stove", desc: "Cook your favorite dishes." },
      { icon: "rice-cooker.png", label: "Rice Cooker", desc: "Perfect rice every time." },
      { icon: "ice-maker.png", label: "Ice Maker", desc: "Cold drinks always ready." },
      { icon: "water-dispenser.png", label: "Water Dispenser", desc: "Clean, cold, and hot water." }
    ]
  },
  {
    category: "Entertainment",
    items: [
      { icon: "wifi.png", label: "Wifi", desc: "Fast and free internet." },
      { icon: "karaoke.png", label: "Karaoke", desc: "Sing your heart out!" },
      { icon: "tv.png", label: "Smart TV", desc: "Netflix and chill." },
      { icon: "boardgame.png", label: "Game Boards", desc: "Fun for all ages." }
    ]
  },
  {
    category: "Bath",
    items: [
      { icon: "shower.png", label: "Hot/Cold Shower", desc: "Refresh anytime." },
      { icon: "bathtub.png", label: "Bath Tub", desc: "Soak and relax." }
    ]
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const categoriesContainer = document.querySelector('.amenities__categories');
  const carousel = document.querySelector('.amenities__carousel');
  const indicator = document.querySelector('.amenities__indicator');
  const controlsContainer = document.querySelector('.amenities__carousel-controls');
  const amenitiesSection = document.getElementById('amenities');

  let currentCategory = 0;
  let currentSlide = 0;
  let slideDirection = 'right';

  function getCardsPerSlide() {
    return 4; // Always 4 per slide
  }

  function renderCategories() {
    categoriesContainer.innerHTML = '';
    amenitiesData.forEach((cat, idx) => {
      const btn = document.createElement('button');
      btn.className = 'category-btn' + (idx === currentCategory ? ' active' : '');
      btn.setAttribute('aria-label', `${cat.category} amenities`);
      btn.setAttribute('data-category', cat.category);
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', idx === currentCategory ? 'true' : 'false');
      btn.innerHTML = `
        <span class="category-label">${cat.category}</span>
        <span class="category-count">(${cat.items.length})</span>
      `;
      btn.onclick = () => {
        currentCategory = idx;
        currentSlide = 0;
        window.justSwitchedCategory = true;
        renderAll();
      };
      categoriesContainer.appendChild(btn);
    });
  }

  function renderCarousel() {
    carousel.innerHTML = '';
    const items = amenitiesData[currentCategory].items;
    const cardsPerSlide = 4;
    const slides = [];
    for (let i = 0; i < items.length; i += cardsPerSlide) {
      slides.push(items.slice(i, i + cardsPerSlide));
    }

    // Only render the current slide
    const slide = slides[currentSlide] || [];
    const slideDiv = document.createElement('div');

    // Animation class
    let animClass = '';
    if (window.justSwitchedCategory) {
      animClass = ' slide-fade';
      window.justSwitchedCategory = false;
    } else if (window.slideDirection === 'right') {
      animClass = ' slide-in-right';
    } else if (window.slideDirection === 'left') {
      animClass = ' slide-in-left';
    }

    slideDiv.className = 'amenities__slide active' + animClass;

    slide.forEach(item => {
      slideDiv.innerHTML += `
        <div class="amenity">
          <img src="assets/icons/${item.icon}" alt="${item.label}" class="amenity__icon">
          <span class="amenity__label">${item.label}</span>
          <span class="amenity__desc">${item.desc}</span>
        </div>
      `;
    });

    carousel.appendChild(slideDiv);
  }

  function renderIndicator() {
    indicator.innerHTML = '';
    const items = amenitiesData[currentCategory].items;
    const cardsPerSlide = getCardsPerSlide();
    const slideCount = Math.ceil(items.length / cardsPerSlide);
    if (slideCount <= 1) {
      indicator.style.display = 'none';
      return;
    } else {
      indicator.style.display = '';
    }
    for (let i = 0; i < slideCount; i++) {
      const dot = document.createElement('span');
      dot.className = 'amenities__dot' + (i === currentSlide ? ' active' : '');
      dot.onclick = () => {
        currentSlide = i;
        renderAll();
      };
      indicator.appendChild(dot);
    }
  }

  function renderControls() {
    controlsContainer.innerHTML = '';
    const items = amenitiesData[currentCategory].items;
    const cardsPerSlide = getCardsPerSlide();
    const slideCount = Math.ceil(items.length / cardsPerSlide);

    if (currentSlide > 0) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'amenities__carousel-btn prev';
      prevBtn.setAttribute('aria-label', 'Previous');
      prevBtn.innerHTML = '&#8592;';
      prevBtn.onclick = () => {
        window.slideDirection = 'left';
        currentSlide--;
        renderAll();
      };
      controlsContainer.appendChild(prevBtn);
    }

    if (currentSlide < slideCount - 1) {
      const nextBtn = document.createElement('button');
      nextBtn.className = 'amenities__carousel-btn next';
      nextBtn.setAttribute('aria-label', 'Next');
      nextBtn.innerHTML = '&#8594;';
      nextBtn.onclick = () => {
        window.slideDirection = 'right';
        currentSlide++;
        renderAll();
      };
      controlsContainer.appendChild(nextBtn);
    }
  }

  function renderAll() {
    renderCategories();
    renderCarousel();
    renderIndicator();
    renderControls();
  }

  function goToSlide(idx) {
    currentSlide = idx;
    renderCarousel();
    renderIndicator();
  }

  // Responsive: re-render on resize
  window.addEventListener('resize', () => {
    currentSlide = 0;
    renderAll();
  });

  // --- Touch/Swipe Support ---
  let xDown = null, yDown = null, startX = null;
  function handleTouchStart(evt) {
    xDown = evt.touches[0].clientX;
    yDown = evt.touches[0].clientY;
  }
  function handleTouchMove(evt) {
    if (!xDown || !yDown) return;
    let xUp = evt.touches[0].clientX;
    let yUp = evt.touches[0].clientY;
    let xDiff = xDown - xUp;
    let yDiff = yDown - yUp;
    if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 30) {
      const items = amenitiesData[currentCategory].items;
      const slideCount = Math.ceil(items.length / getCardsPerSlide());
      if (xDiff > 0 && currentSlide < slideCount - 1) {
        currentSlide++;
        slideDirection = 'right';
        renderAll();
      } else if (xDiff < 0 && currentSlide > 0) {
        currentSlide--;
        slideDirection = 'left';
        renderAll();
      }
      xDown = null;
      yDown = null;
    }
  }
  if (amenitiesSection) {
    amenitiesSection.addEventListener('touchstart', handleTouchStart, false);
    amenitiesSection.addEventListener('touchmove', handleTouchMove, false);

    amenitiesSection.addEventListener('mousedown', (e) => {
      startX = e.clientX;
    });
    amenitiesSection.addEventListener('mouseup', (e) => {
      if (startX === null) return;
      let diff = startX - e.clientX;
      const items = amenitiesData[currentCategory].items;
      const slideCount = Math.ceil(items.length / getCardsPerSlide());
      if (Math.abs(diff) > 30) {
        if (diff > 0 && currentSlide < slideCount - 1) {
          currentSlide++;
          slideDirection = 'right';
          renderAll();
        } else if (diff < 0 && currentSlide > 0) {
          currentSlide--;
          slideDirection = 'left';
          renderAll();
        }
      }
      startX = null;
    });
  }

  // Initial render
  renderAll();
});