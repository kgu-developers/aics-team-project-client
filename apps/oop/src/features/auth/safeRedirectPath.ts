/**
 * Only same-app absolute paths may be used as a post-login destination.
 * Anything that could leave the origin (`//evil`, `https:`, `javascript:`)
 * or that is not a path at all is dropped.
 */
export function safeRedirectPath(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\'))
    return undefined;
  if (value === '/login' || value.startsWith('/login?')) return undefined;
  return value;
}
