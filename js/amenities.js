const amenitiesData = [
  {
    category: "Outdoor",
    items: [
      { icon: "pool.png", label: "Adult Pool", desc: "Relax and swim in our spacious pool. Enjoy the cool water and unwind with friends and family all day long. Perfect for both kids and adults, with a safe and clean environment." },
      { icon: "playground.png", label: "Play/Open Area", desc: "Wide space for games and fun. Let your kids run free or organize group activities. The open area is ideal for sports, picnics, and outdoor gatherings under the sun." },
      { icon: "furniture.png", label: "Outdoor Furnitures", desc: "Chill with comfy outdoor seats. Our premium furniture is designed for relaxation, whether you want to lounge, read a book, or enjoy a meal outdoors with a scenic view." },
      { icon: "camera.png", label: "Insta Spots", desc: "Perfect corners for your IG feed. Capture memories in our beautifully designed photo spots, with unique backgrounds and natural lighting for the best pictures." },
      { icon: "bbq.png", label: "Outdoor BBQ", desc: "Grill and dine al fresco. Host a barbecue party with our complete grilling setup, utensils, and shaded dining area. Enjoy delicious meals in the fresh air with loved ones." }
    ]
  },
  {
    category: "Kitchen",
    items: [
      { icon: "utensils.png", label: "Kitchen Utensils", desc: "Cookware and tableware provided. We supply everything you need for meal prep, from pots and pans to plates, glasses, and cutlery for a hassle-free stay." },
      { icon: "fridge.png", label: "Refrigerator", desc: "Keep your food and drinks cool. Our spacious fridge is perfect for storing groceries, leftovers, and beverages, ensuring freshness throughout your visit." },
      { icon: "microwave.png", label: "Microwave Oven", desc: "Heat up meals anytime. Whether it's a quick snack or a full meal, our microwave is easy to use and always clean for your convenience." },
      { icon: "kettle.png", label: "Electric Kettle", desc: "Hot water on demand. Make coffee, tea, or instant noodles anytime with our fast-boiling electric kettle, available in the kitchen for your use." },
      { icon: "stove.png", label: "Gas/Induction Stove", desc: "Cook your favorite dishes. Our modern stove is safe, efficient, and easy to operate, suitable for all your culinary needs during your stay." },
      { icon: "rice-cooker.png", label: "Rice Cooker", desc: "Perfect rice every time. Enjoy fluffy, perfectly cooked rice with our reliable rice cooker, a must-have for every meal at the cabin." },
      { icon: "ice-maker.png", label: "Ice Maker", desc: "Cold drinks always ready. Our ice maker ensures you have plenty of ice for refreshments, cocktails, and more, especially on hot days." },
      { icon: "water-dispenser.png", label: "Water Dispenser", desc: "Clean, cold, and hot water. Stay hydrated with our easy-to-use dispenser, providing safe drinking water for all guests at any time." }
    ]
  },
  {
    category: "Entertainment",
    items: [
      { icon: "wifi.png", label: "Wifi", desc: "Fast and free internet. Stay connected for work or play, stream your favorite shows, or share your vacation moments online with reliable wifi." },
      { icon: "karaoke.png", label: "Karaoke", desc: "Sing your heart out! Our karaoke system is loaded with thousands of songs, perfect for parties and family fun nights at the cabin." },
      { icon: "tv.png", label: "Smart TV", desc: "Netflix and chill. Enjoy a wide selection of streaming services, movies, and shows on our large smart TV, complete with surround sound." },
      { icon: "boardgame.png", label: "Game Boards", desc: "Fun for all ages. Choose from a variety of classic and modern board games, ideal for bonding and laughter with friends and family." }
    ]
  },
  {
    category: "Bath",
    items: [
      { icon: "shower.png", label: "Hot/Cold Shower", desc: "Refresh anytime. Our showers offer both hot and cold water, ensuring a comfortable experience no matter the weather or time of day." },
      { icon: "bathtub.png", label: "Bath Tub", desc: "Soak and relax. Unwind in our clean, spacious bathtub, perfect for a soothing soak after a long day of activities at the cabin." }
    ]
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const categoriesContainer = document.querySelector('.amenities__categories');
  const carousel = document.querySelector('.amenities__carousel');
  const indicator = document.querySelector('.amenities__indicator');
  const controlsContainer = document.querySelector('.amenities__carousel-controls');

  let currentCategory = 0;
  let currentSlide = 0;
  let slideDirection = 'right';

  const CARDS_PER_SLIDE = 4;

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
    const slides = [];
    for (let i = 0; i < items.length; i += CARDS_PER_SLIDE) {
      slides.push(items.slice(i, i + CARDS_PER_SLIDE));
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

    // Render real cards
    slide.forEach(item => {
      slideDiv.innerHTML += `
        <div class="amenity">
          <img src="assets/icons/amenities/${item.icon}" alt="${item.label}" class="amenity__icon">
          <span class="amenity__label">${item.label}</span>
          <span class="amenity__desc">${item.desc}</span>
        </div>
      `;
    });
    
    // Fill with empty cards if needed
    for (let i = slide.length; i < CARDS_PER_SLIDE; i++) {
      slideDiv.innerHTML += '<div class="amenity amenity--empty"></div>';
    }

    carousel.appendChild(slideDiv);
  }

  function renderIndicator() {
    indicator.innerHTML = '';
    const items = amenitiesData[currentCategory].items;
    const slideCount = Math.ceil(items.length / CARDS_PER_SLIDE);
    
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
    const slideCount = Math.ceil(items.length / CARDS_PER_SLIDE);

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

  function handleSwipe(direction) {
    const items = amenitiesData[currentCategory].items;
    const slideCount = Math.ceil(items.length / CARDS_PER_SLIDE);
    
    if (direction === 'next' && currentSlide < slideCount - 1) {
      currentSlide++;
      slideDirection = 'right';
      renderAll();
    } else if (direction === 'prev' && currentSlide > 0) {
      currentSlide--;
      slideDirection = 'left';
      renderAll();
    }
  }

  // Touch/Swipe Support
  let xDown = null;
  let yDown = null;
  let startX = null;

  function handleTouchStart(evt) {
    xDown = evt.touches[0].clientX;
    yDown = evt.touches[0].clientY;
  }

  function handleTouchMove(evt) {
    if (!xDown || !yDown) return;
    
    const xUp = evt.touches[0].clientX;
    const yUp = evt.touches[0].clientY;
    const xDiff = xDown - xUp;
    const yDiff = yDown - yUp;
    
    if (Math.abs(xDiff) > Math.abs(yDiff) && Math.abs(xDiff) > 30) {
      if (xDiff > 0) {
        handleSwipe('next');
      } else {
        handleSwipe('prev');
      }
      xDown = null;
      yDown = null;
    }
  }

  // Mouse drag support
  function handleMouseDown(e) {
    startX = e.clientX;
  }

  function handleMouseUp(e) {
    if (startX === null) return;
    
    const diff = startX - e.clientX;
    if (Math.abs(diff) > 30) {
      if (diff > 0) {
        handleSwipe('next');
      } else {
        handleSwipe('prev');
      }
    }
    startX = null;
  }

  // Event listeners
  carousel.addEventListener('touchstart', handleTouchStart, false);
  carousel.addEventListener('touchmove', handleTouchMove, false);
  carousel.addEventListener('mousedown', handleMouseDown);
  carousel.addEventListener('mouseup', handleMouseUp);

  // Responsive: re-render on resize
  window.addEventListener('resize', () => {
    currentSlide = 0;
    renderAll();
  });

  // Initial render
  renderAll();
});