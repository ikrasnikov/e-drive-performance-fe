// Cookie consent: the banner until the visitor makes a choice, the settings dialog (also opened from
// the footer) and the stored choice. Code that needs consent (analytics) checks getConsent() on load
// and listens to the "cookie-consent-change" event on document.

const STORAGE_KEY = 'cookie-consent';
// Bump when the cookie categories change: everyone is asked again
const CONSENT_VERSION = 1;
export const CONSENT_CHANGE_EVENT = 'cookie-consent-change';

// Storage can be unavailable (private mode, blocked site data): then the banner is simply shown again
export const getConsent = () => {
  try {
    const consent = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return consent?.version === CONSENT_VERSION ? consent : null;
  } catch {
    return null;
  }
};

const saveConsent = ({ analytics }) => {
  const consent = { version: CONSENT_VERSION, analytics, date: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  } catch {
    // Not stored: the choice still applies to this page view
  }
  document.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: consent }));
};

export const initCookieConsent = () => {
  const banner = document.querySelector('[data-cookie-banner]');
  const dialog = document.querySelector('[data-cookie-dialog]');
  if (!banner || !dialog) {
    return;
  }

  const analyticsInput = dialog.querySelector('[data-consent-analytics]');

  banner.hidden = Boolean(getConsent());

  const openSettings = () => {
    analyticsInput.checked = getConsent()?.analytics ?? false;
    dialog.showModal();
  };

  const choose = (action) => {
    const analytics = { accept: true, reject: false }[action] ?? analyticsInput.checked;
    saveConsent({ analytics });
    // The focused button disappears with the banner: keep the focus at the start of the content
    const focusWasInBanner = banner.contains(document.activeElement);
    banner.hidden = true;
    if (dialog.open) {
      dialog.close();
    }
    if (focusWasInBanner) {
      document.querySelector('#main')?.focus({ preventScroll: true });
    }
  };

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-cookie-settings]')) {
      openSettings();
      return;
    }
    const action = event.target.closest('[data-consent]')?.dataset.consent;
    if (action) {
      choose(action);
    }
  });

  dialog
    .querySelector('[data-cookie-dialog-close]')
    .addEventListener('click', () => dialog.close());

  // A click on the backdrop (outside the body of the dialog) closes it, like Escape
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
};
