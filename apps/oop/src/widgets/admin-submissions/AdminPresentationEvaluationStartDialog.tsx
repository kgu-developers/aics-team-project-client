import type { AdminSectionMilestoneDto } from '@aics/api-client';
import {
  Button,
  Card,
  Dialog,
  Heading,
  HStack,
  NumberInput,
  Text,
  VStack,
} from '@aics/design-system';
import { useEffect, useMemo, useState } from 'react';

import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

import {
  assertAdminMilestoneScheduleOrder,
  formatAdminMilestoneRequestError,
  toAdminMilestoneRequestError,
} from '~/features/admin-milestone-review/model';
import { useUpdateAdminSectionMilestoneEvaluationWindowMutation } from '~/features/admin-milestone-review/queries';

import * as styles from './AdminPresentationEvaluationStartDialog.css';
import {
  MAX_EVALUATION_DURATION_MINUTES,
  createEvaluationResumeWindow,
  createEvaluationWindowFromNow,
  isValidEvaluationDurationMinutes,
  normalizeEvaluationOpensAt,
} from './adminPresentationEvaluationWindow';

const previewClockRefreshInterval = 30_000;

export function AdminPresentationEvaluationStartDialog({
  criteriaCount,
  isOpen,
  milestone,
  mode = 'start',
  onClose,
  onWindowUpdated,
  sectionId,
  teams,
}: {
  criteriaCount: number;
  isOpen: boolean;
  milestone: AdminSectionMilestoneDto;
  mode?: 'resume' | 'start';
  onClose: () => void;
  onWindowUpdated: () => void;
  sectionId: string;
  teams: ReadonlyArray<{ presentationOrder: number | null; teamName: string }>;
}) {
  const mutation = useUpdateAdminSectionMilestoneEvaluationWindowMutation();
  const [durationMinutes, setDurationMinutes] = useState<number | null>(60);
  const [formError, setFormError] = useState<string>();
  const [previewClock, setPreviewClock] = useState(() => Date.now());
  const isResume = mode === 'resume';
  const normalizedEvaluationOpensAt = milestone.schedule.evaluationOpensAt
    ? normalizeEvaluationOpensAt(milestone.schedule.evaluationOpensAt)
    : null;

  useEffect(() => {
    if (!isOpen) {
      setFormError(undefined);
      return;
    }

    setPreviewClock(Date.now());
    const timer = window.setInterval(
      () => setPreviewClock(Date.now()),
      previewClockRefreshInterval,
    );
    return () => window.clearInterval(timer);
  }, [isOpen]);

  const previewWindow = useMemo(
    () =>
      isValidEvaluationDurationMinutes(durationMinutes)
        ? isResume
          ? normalizedEvaluationOpensAt
            ? createEvaluationResumeWindow(
                normalizedEvaluationOpensAt,
                durationMinutes,
                previewClock,
              )
            : null
          : createEvaluationWindowFromNow(durationMinutes, previewClock)
        : null,
    [durationMinutes, isResume, normalizedEvaluationOpensAt, previewClock],
  );

  function handleClose() {
    setFormError(undefined);
    onClose();
  }

  if (!isOpen) return null;

  async function handleSubmit() {
    if (!isValidEvaluationDurationMinutes(durationMinutes)) {
      setFormError(
        `평가 진행 시간은 1분 이상 ${MAX_EVALUATION_DURATION_MINUTES.toLocaleString()}분 이하의 정수로 입력해 주세요.`,
      );
      return;
    }

    if (isResume && !normalizedEvaluationOpensAt) {
      setFormError('기존 평가 시작 시각을 찾을 수 없어 재개할 수 없습니다.');
      return;
    }

    const window = isResume
      ? createEvaluationResumeWindow(
          normalizedEvaluationOpensAt!,
          durationMinutes,
        )
      : createEvaluationWindowFromNow(durationMinutes);
    try {
      assertAdminMilestoneScheduleOrder({
        dueAt: milestone.schedule.dueAt ?? '',
        evaluationClosesAt: window.evaluationClosesAt,
        evaluationOpensAt: window.evaluationOpensAt,
        lateSubmissionUntil:
          milestone.schedule.lateSubmissionUntil ?? undefined,
        revisionUntil: milestone.schedule.revisionUntil ?? undefined,
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : '평가 시작 가능 여부를 확인해 주세요.',
      );
      return;
    }

    setFormError(undefined);
    try {
      await mutation.mutateAsync({
        input: window,
        milestoneId: String(milestone.id),
        sectionId,
      });
      onWindowUpdated();
      onClose();
    } catch (error) {
      setFormError(
        formatAdminMilestoneRequestError(toAdminMilestoneRequestError(error)),
      );
    }
  }

  return (
    <Dialog
      aria-label={isResume ? '발표 평가 재개' : '발표 평가 시작'}
      isOpen
      onOpenChange={nextIsOpen => {
        if (!nextIsOpen) handleClose();
      }}
      purpose='form'
      width={560}
    >
      <VStack className={styles.content} gap={4}>
        <Heading level={2}>
          {isResume ? '발표 평가 재개' : '발표 평가 시작'}
        </Heading>
        <Text color='secondary' type='supporting'>
          {isResume
            ? '재개하면 학생이 기존 발표 평가 점수를 다시 수정할 수 있습니다.'
            : '시작을 확정하면 학생 발표 평가가 바로 열립니다. 평가 항목과 모든 팀의 발표 순서를 확인한 뒤 시작해 주세요.'}
        </Text>
        <div className={styles.summary}>
          <Text>평가 항목: {criteriaCount}개</Text>
          <Text>발표 대상: {teams.length}팀</Text>
          <Text>발표 순서: {teams.map(team => team.teamName).join(' → ')}</Text>
        </div>
        {!isResume && criteriaCount === 1 ? (
          <Card padding={3} variant='muted'>
            <VStack gap={1}>
              <Text weight='medium'>시작 전 확인</Text>
              <Text>
                현재 학생에게는 발표 평가 항목 1개만 표시됩니다. 의도한 구성인지
                확인한 뒤 평가를 시작해 주세요.
              </Text>
            </VStack>
          </Card>
        ) : null}
        <NumberInput
          isIntegerOnly
          label='평가 진행 시간(분)'
          max={MAX_EVALUATION_DURATION_MINUTES}
          min={1}
          onChange={setDurationMinutes}
          status={
            formError
              ? {
                  message: formError,
                  type: 'error',
                }
              : undefined
          }
          value={durationMinutes}
          width='100%'
        />
        {previewWindow ? (
          <Text color='secondary' type='supporting'>
            {isResume ? '지금 재개' : '지금 시작'} · 종료 예정{' '}
            {formatSeoulDateTime(previewWindow.evaluationClosesAt)}
          </Text>
        ) : null}
        <HStack gap={2} justify='end'>
          <Button
            isDisabled={mutation.isPending}
            label='취소'
            onClick={handleClose}
            variant='secondary'
          />
          <Button
            isDisabled={mutation.isPending}
            isLoading={mutation.isPending}
            label={isResume ? '평가 재개' : '평가 시작'}
            onClick={() => void handleSubmit()}
          />
        </HStack>
      </VStack>
    </Dialog>
  );
}
