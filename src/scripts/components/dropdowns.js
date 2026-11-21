import { desktopQuery } from '../media.js';

/**
 * Dropdowns marked with data-dropdown="<bem-block>": the toggle ([data-dropdown-toggle]) flips
 * aria-expanded and the "<bem-block>--open" modifier. Floating dropdowns (desktop navigation,
 * or any dropdown with data-dropdown-floating) also open on mouse hover and close on outside click,
 * focus leaving or Escape; navigation submenus in the mobile menu work as accordions.
 */
export const initDropdowns = () => {
  const dropdowns = [...document.querySelectorAll('[data-dropdown]')];

  const getToggle = (dropdown) => dropdown.querySelector('[data-dropdown-toggle]');
  const isOpen = (dropdown) => getToggle(dropdown).getAttribute('aria-expanded') === 'true';

  const setOpen = (dropdown, open) => {
    getToggle(dropdown).setAttribute('aria-expanded', String(open));
    dropdown.classList.toggle(`${dropdown.dataset.dropdown}--open`, open);
  };

  const isFloating = (dropdown) =>
    desktopQuery.matches || dropdown.hasAttribute('data-dropdown-floating');

  const closeAll = (except) => {
    dropdowns
      .filter((dropdown) => dropdown !== except)
      .forEach((dropdown) => setOpen(dropdown, false));
  };

  dropdowns.forEach((dropdown) => {
    let openedByHover = false;

    getToggle(dropdown).addEventListener('click', () => {
      // A click right after hover-open should not close the menu the user is pointing at
      if (openedByHover) {
        openedByHover = false;
        return;
      }
      if (isFloating(dropdown)) {
        closeAll(dropdown);
      }
      setOpen(dropdown, !isOpen(dropdown));
    });

    dropdown.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse' && isFloating(dropdown) && !isOpen(dropdown)) {
        openedByHover = true;
        closeAll(dropdown);
        setOpen(dropdown, true);
      }
    });

    dropdown.addEventListener('pointerleave', (event) => {
      if (event.pointerType === 'mouse' && isFloating(dropdown)) {
        openedByHover = false;
        setOpen(dropdown, false);
      }
    });

    dropdown.addEventListener('focusout', (event) => {
      if (isFloating(dropdown) && !dropdown.contains(event.relatedTarget)) {
        setOpen(dropdown, false);
      }
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-dropdown]')) {
      dropdowns.filter(isFloating).forEach((dropdown) => setOpen(dropdown, false));
    }
  });

  document.addEventListener('keydown', (event) => {
    const openDropdown = dropdowns.find(isOpen);
    if (event.key !== 'Escape' || !openDropdown) {
      return;
    }
    event.preventDefault();
    setOpen(openDropdown, false);
    getToggle(openDropdown).focus();
  });

  desktopQuery.addEventListener('change', () => closeAll());
};
