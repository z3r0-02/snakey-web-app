export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

export const PASSWORD_ERROR_CODES = {
  TOO_SHORT: "PASSWORD_TOO_SHORT",
  MISSING_UPPERCASE: "PASSWORD_MISSING_UPPERCASE",
  MISSING_NUMBER: "PASSWORD_MISSING_NUMBER",
};

// Each code to the locale key.
export const PASSWORD_ERROR_LOCALE_KEYS = {
  [PASSWORD_ERROR_CODES.TOO_SHORT]: "errPassShort",
  [PASSWORD_ERROR_CODES.MISSING_UPPERCASE]: "errPassUpper",
  [PASSWORD_ERROR_CODES.MISSING_NUMBER]: "errPassNum",
};

export function getPasswordError(password) {
  if (password.length < 8) return PASSWORD_ERROR_CODES.TOO_SHORT;
  if (!/[A-Z]/.test(password)) return PASSWORD_ERROR_CODES.MISSING_UPPERCASE;
  if (!/[0-9]/.test(password)) return PASSWORD_ERROR_CODES.MISSING_NUMBER;
  return null;
}
