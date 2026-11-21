// Adds a shadow to the sticky header once the page is scrolled
export const initHeader = () => {
  const header = document.querySelector('[data-header]');
  if (!header) {
    return;
  }

  const update = () => header.classList.toggle('site-header--scrolled', window.scrollY > 0);

  update();
  window.addEventListener('scroll', update, { passive: true });
};
