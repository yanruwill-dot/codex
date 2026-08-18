(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#home-nav');
  const progress = document.querySelector('.page-progress span');

  if (menuButton && nav) {
    const closeMenu = () => {
      menuButton.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
    };

    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('open', open);
    });

    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  if (progress) {
    let scheduled = false;
    const updateProgress = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      progress.style.transform = `scaleX(${ratio})`;
      scheduled = false;
    };
    window.addEventListener('scroll', () => {
      if (!scheduled) {
        window.requestAnimationFrame(updateProgress);
        scheduled = true;
      }
    }, { passive: true });
    updateProgress();
  }
})();
