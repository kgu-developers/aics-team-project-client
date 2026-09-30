import type { AdminSectionMilestoneDto } from '@aics/api-client';
import {
  Button,
  Dialog,
  Heading,
  HStack,
  Text,
  VStack,
} from '@aics/design-system';
import { useEffect, useState } from 'react';

import {
  assertAdminMilestoneScheduleOrder,
  formatAdminMilestoneRequestError,
  toAdminMilestoneRequestError,
} from '~/features/admin-milestone-review/model';
import { useUpdateAdminSectionMilestoneEvaluationWindowMutation } from '~/features/admin-milestone-review/queries';

import * as styles from './AdminPresentationEvaluationEndDialog.css';
import { createEvaluationEndWindow } from './adminPresentationEvaluationWindow';

export function AdminPresentationEvaluationEndDialog({
  isOpen,
  milestone,
  onClose,
  onWindowUpdated,
  sectionId,
}: {
  isOpen: boolean;
  milestone: AdminSectionMilestoneDto;
  onClose: () => void;
  onWindowUpdated: () => void;
  sectionId: string;
}) {
  const mutation = useUpdateAdminSectionMilestoneEvaluationWindowMutation();
  const [formError, setFormError] = useState<string>();

  useEffect(() => {
    if (!isOpen) setFormError(undefined);
  }, [isOpen]);

  function handleClose() {
    setFormError(undefined);
    onClose();
  }

  if (!isOpen) return null;

  async function handleEnd() {
    const evaluationOpensAt = milestone.schedule.evaluationOpensAt;
    if (!evaluationOpensAt) {
      setFormError('기존 평가 시작 시각을 찾을 수 없어 종료할 수 없습니다.');
      return;
    }

    const window = createEvaluationEndWindow(evaluationOpensAt);
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
          : '평가 종료 가능 여부를 확인해 주세요.',
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
      aria-label='발표 평가 조기 종료'
      isOpen
      onOpenChange={nextIsOpen => {
        if (!nextIsOpen) handleClose();
      }}
      purpose='form'
      width={520}
    >
      <VStack className={styles.content} gap={4}>
        <Heading level={2}>발표 평가를 지금 종료할까요?</Heading>
        <Text color='secondary' type='supporting'>
          종료하면 학생은 발표 평가를 새로 제출하거나 기존 점수를 수정할 수
          없습니다. 종료 뒤에도 발표 기록과 평가 설정은 읽기 전용으로 확인할 수
          있습니다.
        </Text>
        {formError ? <Text role='alert'>{formError}</Text> : null}
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
            label='평가 종료'
            onClick={() => void handleEnd()}
            variant='destructive'
          />
        </HStack>
      </VStack>
    </Dialog>
  );
}
