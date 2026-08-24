import { createLazyFileRoute } from '@tanstack/react-router';

import ProposalEditorPage from '~/features/proposal/ProposalEditorPage';

export const Route = createLazyFileRoute('/student/editor/proposal/$section')({
  component: ProposalEditorSectionRoute,
});

function ProposalEditorSectionRoute() {
  const { section } = Route.useParams();
  return <ProposalEditorPage section={section} />;
}
