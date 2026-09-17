export const DEFAULT_OPEN_CHAT_URL = 'https://open.kakao.com/o/s38nlZNi';

/** Public build-time configuration; only secure external invitation links are allowed. */
export function getOpenChatUrl(
  value = import.meta.env.VITE_OPEN_CHAT_URL ?? DEFAULT_OPEN_CHAT_URL,
): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password)
      return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}
