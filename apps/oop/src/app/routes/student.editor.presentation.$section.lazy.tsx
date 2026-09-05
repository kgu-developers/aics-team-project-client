import { createLazyFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createLazyFileRoute(
  '/student/editor/presentation/$section',
)({
  component: PresentationEditorSectionRoute,
});

function PresentationEditorSectionRoute() {
  return <Navigate replace to='/student' />;
}
