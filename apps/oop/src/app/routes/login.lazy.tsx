import { createLazyFileRoute } from '@tanstack/react-router';

import LoginForm from '~/features/auth/forms/LoginForm';

export const Route = createLazyFileRoute('/login')({
  component: LoginForm,
});
