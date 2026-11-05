import { RouterProvider, createRouter } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import { appQueryClient } from './app/providers/query-provider';
import { routeTree } from './app/routeTree.gen';
import { restoreSession } from './features/auth/restoreSession';
import { startSessionSync } from './features/auth/sessionSync';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

async function disableMocking() {
  if (
    typeof navigator === 'undefined' ||
    !('serviceWorker' in navigator) ||
    !import.meta.env.DEV
  ) {
    return;
  }

  for (const cookie of document.cookie.split(';')) {
    const [name, value] = cookie.trim().split('=');
    if (value?.startsWith('msw-oop-'))
      document.cookie = `${name}=; Path=/; Max-Age=0`;
  }
  sessionStorage.removeItem('aics:demo-session-generations');
  localStorage.removeItem('aics:demo-session-generations');
  localStorage.removeItem('__msw-cookie-store__');
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter(registration =>
        registration.active?.scriptURL.endsWith('/mockServiceWorker.js'),
      )
      .map(registration => registration.unregister()),
  );
}

async function bootstrap() {
  await disableMocking();
  startSessionSync(() => appQueryClient.clear());
  await restoreSession();

  const rootElement = document.getElementById('root')!;
  if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    );
  }
}

void bootstrap();
