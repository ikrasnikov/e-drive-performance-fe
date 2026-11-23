// "Back" on the legal pages: returns to the previous page of the site (e.g. the booking form, with
// its scroll position) when the visitor came from it; otherwise the link simply opens the home page
export const initBackLink = () => {
  const link = document.querySelector('[data-back-link]');
  if (!link) {
    return;
  }

  link.addEventListener('click', (event) => {
    const cameFromSite = document.referrer && new URL(document.referrer).origin === location.origin;
    if (cameFromSite && history.length > 1) {
      event.preventDefault();
      history.back();
    }
  });
};
