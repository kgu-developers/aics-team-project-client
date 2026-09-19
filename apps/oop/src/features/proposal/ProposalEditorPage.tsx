import type { EditorReturnContext } from '~/features/editor/editorReturnContext';

import ProjectProposalEditorPage from './ProjectProposalEditorPage';
import ProposalPreviewPage from './ProposalPreviewPage';
import { useProposalEditorSource } from './queries';
export {
  canSubmitProposalDocument,
  getProposalSubmitDisabledReason,
} from './ProposalPreviewPage';
export default function ProposalEditorPage({
  returnTo,
  section,
}: {
  returnTo?: EditorReturnContext;
  section: string;
}) {
  const source = useProposalEditorSource();
  return source === 'preview' ? (
    <ProposalPreviewPage returnTo={returnTo} section={section} />
  ) : (
    <ProjectProposalEditorPage returnTo={returnTo} section={section} />
  );
}
