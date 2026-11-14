// Izvršavanje koda kada se učita DOM stablo
document.addEventListener("DOMContentLoaded", () => {

  // 1. Senka na navigaciji + 2. dugme za povratak na vrh
  const navbar = document.getElementById('mainNavbar');
  const backToTopBtn = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    backToTopBtn.classList.toggle('show', window.scrollY > 400);
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 3. Scroll reveal animacija
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // 4. Aktivan link u navigaciji tokom skrolovanja
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

  window.addEventListener('scroll', () => {
    let currentId = 'pocetna';
    sections.forEach(section => {
      if (window.scrollY >= section.offsetTop - 120) currentId = section.id;
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      // Link "Početna" ima href="#", pa se poredi sa sekcijom #pocetna
      const target = href === '#' ? '#pocetna' : href;
      link.classList.toggle('active', target === '#' + currentId);
    });
  });

  // 5. Glatko skrolovanje i zatvaranje mobilnog menija
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');

      // href="#" nije validan selektor (querySelector bi bacio grešku) – vodi na vrh
      if (href === '#') {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const targetSection = document.querySelector(href);
        if (!targetSection) return;
        event.preventDefault();
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      const mobileNavMenu = document.getElementById('navMenu');
      if (mobileNavMenu.classList.contains('show')) {
        bootstrap.Collapse.getOrCreateInstance(mobileNavMenu, { toggle: false }).hide();
      }
    });
  });

});
