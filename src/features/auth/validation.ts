// Matches `minimum_password_length` in supabase/config.toml.
export const MIN_PASSWORD_LENGTH = 6;
export const MAX_DISPLAY_NAME_LENGTH = 50;

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

/** Returns an error message, or null if the input is valid. */
export function validateSignIn(email: string, password: string): string | null {
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address.';
  if (!password) return 'Enter your password.';
  return null;
}

export function validateSignUp(
  email: string,
  password: string,
  displayName: string,
): string | null {
  const name = displayName.trim();
  if (!name) return 'Enter your name.';
  if (name.length > MAX_DISPLAY_NAME_LENGTH) {
    return `Name must be ${MAX_DISPLAY_NAME_LENGTH} characters or fewer.`;
  }
  if (!EMAIL_PATTERN.test(email.trim())) return 'Enter a valid email address.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}
