import { InvalidProposalResponseError } from '@aics/api-client';
import type { Proposal, ProposalBlock, ProposalField } from '@aics/core';
import { Button, EmptyState, useToast } from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

import { useAuthStore } from '~/features/auth/authStore';
import DocumentEditorPage, {
  getSaveErrorMessage,
} from '~/features/editor/DocumentEditorPage';

import ProposalStructuredFields from './ProposalStructuredFields';
import {
  useCompleteProposalBlockMutation,
  useCurrentProposalQuery,
  useSubmitProposalMutation,
  useUpdateProposalBlockMutation,
} from './queries';

type ProposalEditorPageProps = { section: string };

export function canSubmitProposalDocument(
  proposal: Proposal,
  currentUserName: string | undefined,
) {
  if (
    (proposal.status !== 'DRAFT' && proposal.status !== 'REVISION_REQUESTED') ||
    proposal.teamLeaderName !== currentUserName ||
    proposal.blocks.some(block => block.status !== 'COMPLETED')
  )
    return false;

  return (
    proposal.status !== 'REVISION_REQUESTED' ||
    Boolean(
      proposal.revision &&
      proposal.revision.affectedBlockKeys.every(key =>
        proposal.revision?.changedBlockKeys.includes(key),
      ),
    )
  );
}

export function getProposalSubmitDisabledReason(
  proposal: Proposal,
  currentUserName: string | undefined,
) {
  if (proposal.status === 'SUBMITTED') return '이미 제출한 제안서예요.';
  if (proposal.teamLeaderName !== currentUserName)
    return '팀장만 제안서를 제출할 수 있어요.';
  if (proposal.blocks.some(block => block.status !== 'COMPLETED'))
    return '모든 작성 영역을 완료 처리하면 제출할 수 있어요.';
  if (!canSubmitProposalDocument(proposal, currentUserName))
    return '피드백 대상 영역을 실제로 수정한 뒤 다시 완료해 주세요.';
  return proposal.status === 'REVISION_REQUESTED'
    ? '피드백을 반영한 수정본을 다시 제출할 수 있어요.'
    : '모든 작성 영역이 완료되어 제출할 수 있어요.';
}

const COPY = {
  loginRequired: '로그인 후 제안서를 열 수 있어요.',
  loading: '제안서를 불러오는 중이에요.',
  loadFailed: '제안서를 불러오지 못했어요. 다시 시도해 주세요.',
  saveFailed: '저장하지 못했어요. 다시 시도해 주세요.',
} as const;

export default function ProposalPreviewPage({
  section,
}: ProposalEditorPageProps) {
  const toast = useToast();
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.currentUser);
  const query = useCurrentProposalQuery(Boolean(currentUser));

  const mutation = useUpdateProposalBlockMutation();
  const completionMutation = useCompleteProposalBlockMutation();
  const submitMutation = useSubmitProposalMutation();

  const saveBlock = useCallback(
    (input: {
      documentId: string;
      version: number;
      block: ProposalBlock;
      fields: ProposalField[];
    }) =>
      mutation.mutateAsync({
        documentId: input.documentId,
        version: input.version,
        blockKey: input.block.key,
        fields: input.fields,
      }),
    [mutation],
  );

  if (query.isError && query.error instanceof InvalidProposalResponseError) {
    return (
      <EmptyState
        title='제안서 작성 기능을 준비 중이에요.'
        description='주제 확정은 완료할 수 있지만, 현재 서버에서는 제안서 편집 화면을 이용할 수 없어요.'
        actions={
          <Button
            label='학생 홈으로 돌아가기'
            variant='primary'
            onClick={() => {
              void navigate({ to: '/student' });
            }}
          />
        }
      />
    );
  }

  return (
    <DocumentEditorPage
      copy={COPY}
      completion={{
        isBlockCompleted: block => block.status === 'COMPLETED',
        completeBlock: async input => {
          const proposal = await completionMutation.mutateAsync({
            documentId: input.documentId,
            version: input.version,
            blockKey: input.block.key,
          });
          toast({ body: `${input.block.title} 영역을 완료 처리했어요.` });
          return proposal;
        },
        completing: completionMutation.isPending,
        completeError: completionMutation.isError
          ? getSaveErrorMessage(
              completionMutation.error,
              '완료 처리하지 못했어요.',
            )
          : null,
        isDocumentSubmitted: proposal => proposal.status === 'SUBMITTED',
        submit: {
          submitDocument: async (documentId, version) => {
            const proposal = await submitMutation.mutateAsync({
              documentId,
              version,
            });
            toast({
              body: proposal.revision?.resubmittedAt
                ? '피드백을 반영한 제안서를 다시 제출했어요.'
                : '제안서를 제출했어요. 이제 읽기 전용으로 확인할 수 있어요.',
            });
            return proposal;
          },
          submitting: submitMutation.isPending,
          submitError: submitMutation.isError
            ? getSaveErrorMessage(submitMutation.error, '제출하지 못했어요.')
            : null,
          canSubmitDocument: proposal =>
            canSubmitProposalDocument(proposal, currentUser?.name),
          submitDisabledReason: proposal =>
            getProposalSubmitDisabledReason(proposal, currentUser?.name),
        },
      }}
      docId='proposal'
      documentQuery={query}
      editLockTargetType='PROJECT_BLOCK'
      renderFields={({
        documentId,
        block,
        fields,
        isLocked,
        onFieldsChange,
      }) => {
        if (
          block.key !== 'data-composition' &&
          block.key !== 'screen-composition'
        )
          return null;
        return (
          <ProposalStructuredFields
            blockKey={block.key}
            fields={fields}
            isLocked={isLocked}
            key={`${documentId}:${block.key}`}
            onFieldsChange={onFieldsChange}
          />
        );
      }}
      saveBlock={saveBlock}
      saveState={{
        saving: mutation.isPending,
        error: mutation.isError
          ? getSaveErrorMessage(mutation.error, COPY.saveFailed)
          : null,
      }}
      section={section}
    />
  );
}
