const SUNDAY = 0;
const PHONE_MIN_DIGITS = 7;
const PHONE_MAX_DIGITS = 15;
const PHONE_CHARS = /^[+\d\s()-]+$/;
// Matches --transition-base: the text is cleared only after the fade-out animation
const FADE_OUT_MS = 250;
const ERROR_VISIBLE = 'form-field__error--visible';
const STATUS_VISIBLE = 'booking-form__status--visible';

// YYYY-MM-DD in local time (the format of <input type="date">)
const toIsoDate = (date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

const isSunday = (isoDate) => new Date(`${isoDate}T00:00:00`).getDay() === SUNDAY;

const isValidPhone = (value) => {
  const digits = value.replace(/\D/g, '').length;
  return PHONE_CHARS.test(value) && digits >= PHONE_MIN_DIGITS && digits <= PHONE_MAX_DIGITS;
};

// Shows an element by a modifier class; on hide, empties its text after the fade-out animation
const toggleMessage = (element, visibleClass, text) => {
  if (text) {
    element.textContent = text;
    element.classList.add(visibleClass);
    return;
  }
  element.classList.remove(visibleClass);
  setTimeout(() => {
    if (!element.classList.contains(visibleClass)) {
      element.textContent = '';
    }
  }, FADE_OUT_MS);
};

/**
 * Client-side validation of the service request form. Error texts come from the form's
 * data-error-* attributes (translated in the template); each control shows its error in the
 * element referenced by aria-describedby and gets aria-invalid.
 * Sending is not connected yet: a valid form only shows the success message and resets.
 */
export const initBookingForm = () => {
  const form = document.querySelector('[data-booking-form]');
  if (!form) {
    return;
  }

  const messages = form.dataset;
  const status = form.querySelector('[data-booking-status]');
  const statusText = status.querySelector('[data-booking-status-text]');
  const controls = [...form.querySelectorAll('.form-field__control')];
  const today = toIsoDate(new Date());

  form.querySelectorAll('input[type="date"]').forEach((input) => {
    input.min = today;
  });

  const getError = (control) => {
    const value = control.value.trim();
    if (!value) {
      return control.required ? messages.errorRequired : '';
    }
    if (control.type === 'email' && control.validity.typeMismatch) {
      return messages.errorEmail;
    }
    if (control.hasAttribute('data-phone') && !isValidPhone(value)) {
      return messages.errorPhone;
    }
    if (control.type === 'date' && value < today) {
      return messages.errorPast;
    }
    if (control.hasAttribute('data-no-sundays') && isSunday(value)) {
      return messages.errorSunday;
    }
    return '';
  };

  const validate = (control) => {
    const error = getError(control);
    const errorElement = document.getElementById(control.getAttribute('aria-describedby'));
    control.setAttribute('aria-invalid', String(Boolean(error)));
    if (errorElement) {
      toggleMessage(errorElement, ERROR_VISIBLE, error);
    }
    return !error;
  };

  const hideStatus = () => {
    status.classList.remove(STATUS_VISIBLE);
    setTimeout(() => {
      if (!status.classList.contains(STATUS_VISIBLE)) {
        statusText.textContent = '';
      }
    }, FADE_OUT_MS);
  };

  controls.forEach((control) => {
    control.addEventListener('focus', hideStatus);
    control.addEventListener('blur', () => validate(control));
    control.addEventListener('change', () => validate(control));
    // Once a field shows an error, re-check it while the user fixes it
    control.addEventListener('input', () => {
      if (control.getAttribute('aria-invalid') === 'true') {
        validate(control);
      }
    });
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    hideStatus();

    const invalid = controls.filter((control) => !validate(control));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    // TODO: send the request (Web3Forms) and show the success message only after the response
    form.reset();
    controls.forEach((control) => control.removeAttribute('aria-invalid'));
    // Text is set on show, so the role="status" live region announces it
    statusText.textContent = status.dataset.message;
    status.classList.add(STATUS_VISIBLE);
  });
};
