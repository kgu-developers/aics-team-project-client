import axios from 'axios';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

function readCsrfCookie() {
  if (typeof document === 'undefined') return null;

  const prefix = `${CSRF_COOKIE_NAME}=`;
  const cookie = document.cookie
    .split('; ')
    .find(value => value.startsWith(prefix));

  return cookie?.slice(prefix.length) ?? null;
}

/**
 * The API may rotate or bootstrap the readable CSRF cookie on a rejected
 * request. Retry exactly once only when that cookie actually changed.
 */
export async function retryAfterCsrfRotation<T>(request: () => Promise<T>) {
  const csrfBeforeRequest = readCsrfCookie();

  try {
    return await request();
  } catch (error) {
    const csrfAfterRequest = readCsrfCookie();
    const canRetry =
      axios.isAxiosError(error) &&
      error.response?.status === 403 &&
      csrfAfterRequest !== null &&
      csrfAfterRequest !== csrfBeforeRequest;

    if (!canRetry) throw error;
    return request();
  }
}
