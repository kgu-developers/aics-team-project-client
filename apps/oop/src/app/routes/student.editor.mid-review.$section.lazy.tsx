import { createLazyFileRoute } from '@tanstack/react-router';

import EditorSectionPage from '~/app/components/EditorSectionPage';

export const Route = createLazyFileRoute('/student/editor/mid-review/$section')({
  component: MidReviewEditorSectionRoute,
});

function MidReviewEditorSectionRoute() {
  const { section } = Route.useParams();
  return <EditorSectionPage docId='mid-review' section={section} />;
}
