import { createLazyFileRoute } from '@tanstack/react-router';

import EditorSectionPage from '~/app/components/EditorSectionPage';

export const Route = createLazyFileRoute('/student/editor/proposal/$section')({
  component: ProposalEditorSectionRoute,
});

function ProposalEditorSectionRoute() {
  const { section } = Route.useParams();
  return <EditorSectionPage docId='proposal' section={section} />;
}
