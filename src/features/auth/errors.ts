import { getErrorMessage, isNetworkError } from '@/utils/errors';

/** Turns a sign-in or sign-up failure into a message the user can act on. */
export function describeAuthError(error: unknown, action: 'sign in' | 'sign up'): string {
  if (isNetworkError(error)) {
    return 'Could not reach the server. Check your connection and try again.';
  }
  const message = getErrorMessage(error);
  if (/invalid login credentials/i.test(message)) return 'Incorrect email or password.';
  if (/already registered|already exists/i.test(message)) {
    return 'An account with this email already exists. Try signing in.';
  }
  if (/rate limit|too many/i.test(message))
    return 'Too many attempts. Wait a minute and try again.';
  if (/password/i.test(message) && /(at least|short|weak)/i.test(message)) {
    return 'Choose a longer password.';
  }
  return `Could not ${action}. Try again.`;
}
