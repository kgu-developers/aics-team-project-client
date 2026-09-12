import {
  Button,
  EmptyState,
  FileInput,
  Heading,
  Text,
  TextInput,
  VStack,
} from '@aics/design-system';
import { isAxiosError } from 'axios';
import { useRef, useState } from 'react';

import { useAuthStore } from '~/features/auth/authStore';
import { useTeamKickoffQuery } from '~/features/team-assignment/queries';

import * as styles from './FinalReportSubmissionPanel.css';
import {
  useRequiredSubmissionArtifactsQuery,
  useStudentSubmissionQuery,
  useStudentSubmissionVersionsQuery,
  useSubmitStudentSubmissionVersionMutation,
} from './queries';
import type { StudentSubmissionScope } from './submissionScope';
import { submissionUploadInput } from './submissionUploadInput';

export type FinalReportSubmissionTarget = StudentSubmissionScope & {
  submissionId: string;
  type: 'FINAL_REPORT';
  title: string;
};

export default function FinalReportSubmissionPanel({
  target,
}: {
  target: FinalReportSubmissionTarget;
}) {
  const user = useAuthStore(state => state.currentUser);
  const detail = useStudentSubmissionQuery(target, target.submissionId);
  const rules = useRequiredSubmissionArtifactsQuery(target);
  const versions = useStudentSubmissionVersionsQuery(
    target,
    target.submissionId,
  );
  const team = useTeamKickoffQuery(
    target.type === 'FINAL_REPORT' ? target.teamId : undefined,
  );
  const mutation = useSubmitStudentSubmissionVersionMutation(
    target,
    target.submissionId,
  );
  const [files, setFiles] = useState<Record<number, File | null>>({});
  const [values, setValues] = useState<Record<number, string>>({});
  const [description, setDescription] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [uncertain, setUncertain] = useState(false);
  const [checkedAfterFailure, setCheckedAfterFailure] = useState(false);
  const busy = useRef(false);
  const [generation, setGeneration] = useState(0);
  const sameAccount = user?.studentNumber === target.studentNumber;
  const leader =
    team.data?.members.find(
      member => member.studentNumber === target.studentNumber,
    )?.isLeader === true;
  const allowed =
    sameAccount &&
    detail.data?.canSubmitNow &&
    (target.type !== 'FINAL_REPORT' || leader);
  async function refresh() {
    setCheckedAfterFailure(false);
    const [updatedDetail, updatedVersions] = await Promise.all([
      detail.refetch(),
      versions.refetch(),
      rules.refetch(),
    ]);
    if (uncertain && updatedDetail.isSuccess && updatedVersions.isSuccess)
      setCheckedAfterFailure(true);
  }
  if (!sameAccount) return <EmptyState title='로그인을 다시 확인해 주세요.' />;
  if (detail.isPending || rules.isPending)
    return <Text role='status'>제출 정보를 불러오는 중...</Text>;
  if (detail.isError || rules.isError || !detail.data || !rules.data)
    return (
      <EmptyState
        title='제출 정보를 불러오지 못했어요.'
        actions={<Button label='다시 시도' clickAction={refresh} />}
      />
    );
  const data = detail.data;
  const disabled = !allowed || mutation.isPending || uncertain;

  return (
    <VStack gap={4}>
      <Heading level={3}>{target.title}</Heading>
      {!data.canSubmitNow ? (
        <Text role='status'>지금은 제출할 수 없어요.</Text>
      ) : null}
      {target.type === 'FINAL_REPORT' && !leader ? (
        <Text role='status'>
          {team.isError
            ? '팀장 정보를 확인하지 못했어요.'
            : team.isPending
              ? '팀장 정보를 확인하는 중...'
              : '최종보고서는 팀장만 제출할 수 있어요.'}
        </Text>
      ) : null}
      {team.isError ? (
        <Button
          label='팀 정보 다시 확인'
          clickAction={async () => {
            await team.refetch();
          }}
        />
      ) : null}
      {data.hasPendingReview ? (
        <Text color='secondary'>수정 요청된 피드백이 있어요.</Text>
      ) : null}
      {rules.data.length === 0 ? (
        <Text role='status'>
          등록된 제출 항목이 없어요. 담당 교수자에게 확인해 주세요.
        </Text>
      ) : (
        <form
          className={styles.form}
          onSubmit={async event => {
            event.preventDefault();
            if (disabled || busy.current) return;
            setSuccess(undefined);
            setError(undefined);
            let input;
            try {
              input = submissionUploadInput(
                rules.data,
                files,
                values,
                description,
                changeNote,
              );
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : '입력값을 확인해 주세요.',
              );
              return;
            }
            busy.current = true;
            try {
              const result = await mutation.mutateAsync(input);
              if (useAuthStore.getState().currentUser !== user) return;
              setFiles({});
              setValues({});
              setDescription('');
              setChangeNote('');
              setGeneration(previous => previous + 1);
              setSuccess(`파일 제출을 저장했어요. (v${result.currentVersion})`);
            } catch (cause) {
              if (useAuthStore.getState().currentUser !== user) return;
              const status = isAxiosError(cause)
                ? cause.response?.status
                : undefined;
              if (!status || status >= 500) {
                setUncertain(true);
                setCheckedAfterFailure(false);
                setError(
                  '제출 결과를 확인하지 못했어요. 자동으로 다시 제출하지 않습니다. 제출 내역을 새로고침해 결과를 확인해 주세요.',
                );
              } else {
                setError(
                  isAxiosError<{ message?: string }>(cause)
                    ? (cause.response?.data.message ??
                        '제출하지 못했어요. 입력값과 권한을 확인해 주세요.')
                    : '제출하지 못했어요.',
                );
                await refresh();
              }
            } finally {
              busy.current = false;
            }
          }}
        >
          <TextInput
            label='제출 설명'
            isRequired
            value={description}
            onChange={setDescription}
            isDisabled={disabled}
          />
          {data.currentVersion > 0 ? (
            <TextInput
              label='변경 사항'
              value={changeNote}
              onChange={setChangeNote}
              isDisabled={disabled}
            />
          ) : null}
          {rules.data.map(rule =>
            rule.type === 'FILE' ? (
              <FileInput
                key={`${generation}:${rule.id}`}
                label={rule.label}
                mode='input'
                isRequired={rule.required}
                isDisabled={disabled}
                accept={
                  rule.allowedExtensions.length
                    ? rule.allowedExtensions
                        .map(extension => `.${extension.replace(/^\./, '')}`)
                        .join(',')
                    : undefined
                }
                maxSize={
                  rule.maxFileSizeMb == null
                    ? undefined
                    : rule.maxFileSizeMb * 1024 * 1024
                }

                value={files[rule.id] ?? null}
                onChange={selected => {
                  setFiles(previous => ({
                    ...previous,
                    [rule.id]: Array.isArray(selected)
                      ? (selected[0] ?? null)
                      : selected,
                  }));
                  setError(undefined);
                }}
              />
            ) : rule.type === 'TEXT' ? (
              <TextInput
                key={rule.id}
                label={rule.label}
                isRequired={rule.required}
                isDisabled={disabled}
                value={values[rule.id] ?? ''}
                onChange={value =>
                  setValues(previous => ({ ...previous, [rule.id]: value }))
                }
              />
            ) : (
              <TextInput
                key={rule.id}
                label={rule.label}
                isRequired={rule.required}
                isDisabled={disabled}
                value={values[rule.id] ?? ''}
                onChange={value =>
                  setValues(previous => ({ ...previous, [rule.id]: value }))
                }
                placeholder='https://example.com'
              />
            ),
          )}
          <Button
            label={data.currentVersion ? '파일 재제출' : '파일 제출'}
            type='submit'
            variant='primary'
            isDisabled={disabled}
            isLoading={mutation.isPending}
          />
        </form>
      )}
      {error ? <Text role='alert'>{error}</Text> : null}
      {success ? <Text role='status'>{success}</Text> : null}
      {error || !allowed ? (
        <Button
          label='제출 내역 새로고침'
          clickAction={refresh}
          isDisabled={mutation.isPending}
        />
      ) : null}
      {uncertain && versions.isError ? (
        <Text role='alert'>제출 이력을 불러오지 못했어요.</Text>
      ) : null}
      {uncertain && checkedAfterFailure ? (
        <Text>
          현재 제출 버전: v{data.currentVersion}. 카드의 제출 이력에서 결과를
          확인해 주세요.
        </Text>
      ) : null}
      {uncertain ? (
        <Button
          label='제출 내역을 확인했어요. 다시 제출 준비'
          isDisabled={
            !checkedAfterFailure ||
            detail.isError ||
            versions.isError ||
            detail.isFetching ||
            versions.isFetching
          }
          onClick={() => {
            setUncertain(false);
            setError(undefined);
          }}
          variant='secondary'
        />
      ) : null}
    </VStack>
  );
}
