import { defaultParseSearch } from '@tanstack/react-router';

// Use the application's router codec for IDs carried by observed UI links.
export function routeScope(url: URL) {
  return defaultParseSearch(url.search) as Record<string, unknown>;
}

export function meetingRecordRequestPath(observedPath: string) {
  const match = /^\/student\/meetings\/(\d+)$/.exec(observedPath);
  if (!match)
    throw new Error('Expected an observed student meeting detail path');
  return `/api/v1/meeting-records/${match[1]}`;
}
