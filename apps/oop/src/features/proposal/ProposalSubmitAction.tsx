import { Button, useToast } from '@aics/design-system';

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
  return (
    <Button
      className={className}
      isDisabled={isDisabled || actions.isPending}
      isLoading={actions.isPending}
      label={label}
      onClick={() => {
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
        void actions
          .mutateAsync({ kind: 'submit', projectId: project.id })
          .then(() => toast({ body: '제안서를 제출했어요.' }))
          .catch((error: unknown) =>
            toast({ body: documentRequestErrorMessage(error), type: 'error' }),
          );
      }}
      size='md'
      variant='primary'
    />
  );
}
