import { desktopQuery } from '../media.js';

/**
 * Burger menu for mobile and tablet: opens the navigation panel, locks page scroll,
 * closes on Escape, on navigation link click and when the viewport grows to desktop.
 */
export const initMenu = () => {
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (!toggle || !nav) {
    return;
  }

  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? toggle.dataset.labelClose : toggle.dataset.labelOpen);
    nav.classList.toggle('site-nav--open', open);
    document.body.classList.toggle('page--menu-open', open);
  };

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  nav.addEventListener('click', (event) => {
    if (isOpen() && event.target.closest('a')) {
      setOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    // Escape inside an open submenu closes only the submenu (handled in dropdowns.js)
    if (event.key === 'Escape' && !event.defaultPrevented && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  desktopQuery.addEventListener('change', ({ matches }) => {
    if (matches) {
      setOpen(false);
    }
  });
};
