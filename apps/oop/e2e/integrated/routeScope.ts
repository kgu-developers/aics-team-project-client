import { defaultParseSearch } from '@tanstack/react-router';

// Use the application's router codec for IDs carried by observed UI links.
export function routeScope(url: URL) {
  return defaultParseSearch(url.search) as Record<string, unknown>;
}
