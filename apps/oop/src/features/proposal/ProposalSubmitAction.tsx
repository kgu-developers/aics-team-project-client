import { Button, useToast } from '@aics/design-system';
import { useRef } from 'react';

import { documentRequestErrorMessage } from '~/features/editor/documentRequestErrorMessage';

import { proposalSubmitBlocker } from './proposalSubmitGuard';
import {
  useProjectProposalActions,
  useProjectProposalQuery,
  useProposalSectionsQuery,
} from './queries';

type Props = {
  className?: string;
  isDisabled?: boolean;
  label: string;
};
/** Rendered only for the leader's submit row so the card stays free of proposal queries. */
export default function ProposalSubmitAction({
  className,
  isDisabled,
  label,
}: Props) {
  const toast = useToast();
  const proposal = useProjectProposalQuery();
  const sections = useProposalSectionsQuery(proposal.data?.id);
  const actions = useProjectProposalActions();
  const submitting = useRef(false);
  return (
    <Button
      className={className}
      isDisabled={
        isDisabled ||
        proposal.isPending ||
        proposal.isFetching ||
        sections.isPending ||
        sections.isFetching ||
        actions.isPending
      }
      isLoading={actions.isPending}
      label={label}
      onClick={async () => {
        if (submitting.current) return;
        const project = proposal.data;
        const sectionList = sections.data;
        if (!project || !sectionList) {
          toast({
            body: '제안서 상태를 아직 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
            type: 'error',
          });
          return;
        }
        const blocker = proposalSubmitBlocker(project, sectionList);
        if (blocker) {
          toast({ body: blocker, type: 'error' });
          return;
        }
        submitting.current = true;
        try {
          await actions.mutateAsync({ kind: 'submit', projectId: project.id });
          toast({ body: '제안서를 제출했어요.' });
        } catch (error) {
          toast({ body: documentRequestErrorMessage(error), type: 'error' });
        } finally {
          submitting.current = false;
        }
      }}
      size='md'
      variant='primary'
    />
  );
}
