import { createFileRoute } from '@tanstack/react-router';

import { safeRedirectPath } from '~/features/auth/safeRedirectPath';

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: safeRedirectPath(search.redirect),
  }),
});
