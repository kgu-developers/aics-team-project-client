import type { EditorReturnContext } from '~/features/editor/editorReturnContext';

import ProjectProposalEditorPage from './ProjectProposalEditorPage';

export default function ProposalEditorPage(props: {
  returnTo?: EditorReturnContext;
  section: string;
}) {
  return <ProjectProposalEditorPage {...props} />;
}
