/** Reads a message from anything thrown, including Supabase error objects that are not `Error`s. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error as { message: unknown };
    if (typeof message === 'string') return message;
  }
  return '';
}

const NETWORK_PATTERN =
  /network request failed|failed to fetch|fetch failed|load failed|networkerror|network error|timed? ?out|econn|enotfound|offline|internet connection/i;

/** True when an error means the device could not reach the server (offline, timeout, no signal). */
export function isNetworkError(error: unknown): boolean {
  return NETWORK_PATTERN.test(getErrorMessage(error));
}
