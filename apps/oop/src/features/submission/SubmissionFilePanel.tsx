import type { Submission, SubmissionArtifactRule } from '@aics/core';
import {
  Button,
  EmptyState,
  FileInput,
  Heading,
  Text,
  VStack,
} from '@aics/design-system';
import { useEffect, useState } from 'react';

import { useAuthStore } from '~/features/auth/authStore';

import { getSubmissionErrorMessage } from './getSubmissionErrorMessage';
import {
  useMyTeamSubmissionQuery,
  useSubmitSubmissionVersionMutation,
} from './queries';
import * as styles from './SubmissionFilePanel.css';
import {
  formatFileSize,
  validateSubmissionFiles,
} from './validateSubmissionFiles';

type SelectedFiles = Partial<
  Record<SubmissionArtifactRule['key'], File | null>
>;

type SubmissionFilePanelProps = {
  milestoneId: 'presentation' | 'final-report';
  title: string;
  showCurrentFiles?: boolean;
};

function formatSubmittedAt(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function SubmittedFileSummary({ submission }: { submission: Submission }) {
  const version = submission.currentVersion;

  if (!version) {
    return <Text color='secondary'>아직 제출된 파일이 없어요.</Text>;
  }

  return (
    <VStack className={styles.fileSummary} gap={1}>
      <Text weight='medium'>현재 제출 파일</Text>
      {version.artifacts.map(artifact => (
        <Text color='secondary' key={artifact.id} type='supporting'>
          {artifact.kind === 'FILE'
            ? `${artifact.name} · ${formatFileSize(artifact.size)}`
            : artifact.label}
        </Text>
      ))}
      <Text color='secondary' type='supporting'>
        {formatSubmittedAt(version.submittedAt)} · {version.submittedBy.name}
      </Text>
    </VStack>
  );
}

export default function SubmissionFilePanel({
  milestoneId,
  showCurrentFiles = true,
  title,
}: SubmissionFilePanelProps) {
  const currentUser = useAuthStore(state => state.currentUser);
  const sectionId =
    currentUser?.sections.find(section => section.role === 'STUDENT')?.id ?? '';
  const userId = currentUser?.studentNumber ?? '';
  const submissionQuery = useMyTeamSubmissionQuery(
    sectionId,
    userId,
    milestoneId,
  );
  const submitMutation = useSubmitSubmissionVersionMutation(sectionId, userId);
  const [files, setFiles] = useState<SelectedFiles>({});
  const [clientError, setClientError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!submissionQuery.data) return;
    setFiles({});
    setClientError(null);
    setSuccessMessage(null);
  }, [submissionQuery.data?.id]);

  if (!sectionId) {
    return (
      <EmptyState
        description='분반과 팀 배정이 완료되면 파일을 제출할 수 있어요.'
        title='제출 대상을 확인할 수 없어요.'
      />
    );
  }
  if (submissionQuery.isPending) {
    return <Text role='status'>제출 정보를 불러오는 중...</Text>;
  }
  if (submissionQuery.isError || !submissionQuery.data) {
    return (
      <EmptyState
        actions={
          <Button
            clickAction={async () => {
              await submissionQuery.refetch();
            }}
            label='다시 시도'
            variant='primary'
          />
        }
        description={getSubmissionErrorMessage(submissionQuery.error)}
        title='제출 정보를 불러오지 못했어요.'
      />
    );
  }

  const submission = submissionQuery.data;

  return (
    <VStack className={styles.root} gap={4}>
      <Heading level={3}>{title} 파일</Heading>
      {showCurrentFiles ? (
        <SubmittedFileSummary submission={submission} />
      ) : null}
      {!submission.canSubmitNow ? (
        <Text color='secondary'>
          {submission.submitDisabledReason ?? '지금은 제출할 수 없어요.'}
        </Text>
      ) : (
        <form
          className={styles.form}
          onSubmit={event => {
            event.preventDefault();
            setSuccessMessage(null);
            const fileError = validateSubmissionFiles(
              submission.artifactRules,
              files,
            );
            if (fileError) {
              setClientError(fileError);
              return;
            }
            setClientError(null);
            submitMutation.mutate(
              {
                submissionId: submission.id,
                input: {
                  artifacts: submission.artifactRules.map(rule => {
                    const file = files[rule.key]!;
                    return {
                      kind: 'FILE' as const,
                      name: file.name,
                      size: file.size,
                      mimeType: file.type || 'application/octet-stream',
                    };
                  }),
                },
              },
              {
                onSuccess: result => {
                  setFiles({});
                  setSuccessMessage(
                    `파일 제출을 저장했어요. (v${result.currentVersion?.versionNumber})`,
                  );
                },
              },
            );
          }}
        >
          {submission.artifactRules.map(rule => (
            <FileInput
              accept={rule.allowedExtensions
                .map(extension => `.${extension}`)
                .join(',')}
              description={`${rule.allowedExtensions.map(extension => extension.toUpperCase()).join('/')} · 최대 ${formatFileSize(rule.maxSize)}`}
              isRequired
              key={rule.key}
              label={rule.label}
              maxSize={rule.maxSize}
              mode='dropzone'
              onChange={selected => {
                const file = Array.isArray(selected) ? selected[0] : selected;
                setFiles(current => ({ ...current, [rule.key]: file }));
                setClientError(null);
              }}
              placeholder='파일을 끌어 놓거나 눌러서 선택하세요.'
              value={files[rule.key] ?? null}
              width='100%'
            />
          ))}
          {clientError ? <Text role='alert'>{clientError}</Text> : null}
          {submitMutation.isError ? (
            <Text role='alert'>
              {getSubmissionErrorMessage(submitMutation.error)}
            </Text>
          ) : null}
          {successMessage ? <Text role='status'>{successMessage}</Text> : null}
          <Button
            isDisabled={submitMutation.isPending}
            isLoading={submitMutation.isPending}
            label={submission.currentVersion ? '파일 교체' : '파일 제출'}
            type='submit'
            variant='primary'
          />
        </form>
      )}
    </VStack>
  );
}
