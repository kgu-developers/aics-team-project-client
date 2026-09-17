import { createLazyFileRoute } from '@tanstack/react-router';

import StudentMessagesPage from '~/widgets/student-messages/StudentMessagesPage';

export const Route = createLazyFileRoute('/student/messages')({
  component: StudentMessagesPage,
});
