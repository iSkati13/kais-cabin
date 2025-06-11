document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('navbarToggle');
  const links = document.getElementById('navbarLinks');
  const navbar = document.querySelector('.navbar');
  let lastScroll = 0;

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
    });

    window.addEventListener('scroll', () => {
      if (links.classList.contains('open')) {
        links.classList.remove('open');
      }
    });
  }

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll > lastScroll && currentScroll > 80) {
      navbar.classList.add('navbar--hidden');
    } else {
      navbar.classList.remove('navbar--hidden');
    }
    lastScroll = currentScroll;
  });
});