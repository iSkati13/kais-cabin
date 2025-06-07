document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('navbarToggle');
    const links = document.getElementById('navbarLinks');
    if (toggle && links) {
        toggle.addEventListener('click', function() {
            links.classList.toggle('open');
        });

        // Close the menu on scroll
        window.addEventListener('scroll', function() {
            if (links.classList.contains('open')) {
                links.classList.remove('open');
            }
        });
    }

    // Fade navbar on scroll
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        if (currentScroll > lastScroll && currentScroll > 80) {
            // Scrolling down
            navbar.classList.add('navbar--hidden');
        } else {
            // Scrolling up
            navbar.classList.remove('navbar--hidden');
        }
        lastScroll = currentScroll;
    });
});