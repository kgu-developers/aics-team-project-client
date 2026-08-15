import { createLazyFileRoute } from '@tanstack/react-router';

import EditorSectionPage from '~/app/components/EditorSectionPage';

export const Route = createLazyFileRoute(
  '/student/editor/presentation/$section',
)({
  component: PresentationEditorSectionRoute,
});

function PresentationEditorSectionRoute() {
  const { section } = Route.useParams();
  return <EditorSectionPage docId='presentation' section={section} />;
}
