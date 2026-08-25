import { createLazyFileRoute } from '@tanstack/react-router';

import PresentationEditorPage from '~/features/presentation/PresentationEditorPage';

export const Route = createLazyFileRoute(
  '/student/editor/presentation/$section',
)({
  component: PresentationEditorSectionRoute,
});

function PresentationEditorSectionRoute() {
  const { section } = Route.useParams();
  return <PresentationEditorPage section={section} />;
}
