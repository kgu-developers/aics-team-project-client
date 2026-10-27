import { setupWorker } from 'msw/browser';

import { createHandlers } from './handlers';

export const worker = setupWorker(
  ...createHandlers({ persistStudentPages: true }),
);

export function startMockWorker() {
  return worker.start({
    onUnhandledRequest(request, print) {
      // API gaps in a local review must never fall through to a live backend.
      // Vite modules, fonts and navigation are still served normally.
      if (new URL(request.url).pathname.startsWith('/api/')) print.error();
    },
    quiet: true,
  });
}
