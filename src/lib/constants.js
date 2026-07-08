export const GUEST_HOST_EMAIL = "host@platform.local";
export const BCRYPT_SALT_ROUNDS = 10;
export const REDIRECT_DELAY_MS = 800;

export const GENDER_OPTIONS = [
  { value: "female", labelKey: "genderFemale" },
  { value: "male", labelKey: "genderMale" },
  { value: "undisclosed", labelKey: "genderUndisclosed" },
];

const HOST_SESSION_KEY = "__hostSession";

export function isHostSession() {
  try {
    return sessionStorage.getItem(HOST_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

export function setHostSession(active) {
  try {
    if (active) {
      sessionStorage.setItem(HOST_SESSION_KEY, "true");
    } else {
      sessionStorage.removeItem(HOST_SESSION_KEY);
    }
  } catch {
  }
}
