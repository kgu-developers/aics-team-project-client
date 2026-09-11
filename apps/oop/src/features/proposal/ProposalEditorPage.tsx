import ProjectProposalEditorPage from './ProjectProposalEditorPage';
import ProposalPreviewPage from './ProposalPreviewPage';
import { useProposalEditorSource } from './queries';
export {
  canSubmitProposalDocument,
  getProposalSubmitDisabledReason,
} from './ProposalPreviewPage';
export default function ProposalEditorPage({ section }: { section: string }) {
  const source = useProposalEditorSource();
  return source === 'preview' ? (
    <ProposalPreviewPage section={section} />
  ) : (
    <ProjectProposalEditorPage section={section} />
  );
}
