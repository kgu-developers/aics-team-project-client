import type { AdminSectionMilestoneDto } from '@aics/api-client';
import {
  Button,
  DateInput,
  Dialog,
  Heading,
  HStack,
  Text,
  TimeInput,
  type TimeInputProps,
} from '@aics/design-system';
import { useState } from 'react';

import {
  assertAdminMilestoneScheduleOrder,
  formatAdminMilestoneDate,
  formatAdminMilestoneRequestError,
  toAdminMilestoneDateTime,
  toAdminMilestoneRequestError,
} from '~/features/admin-milestone-review/model';
import { useUpdateAdminSectionMilestoneEvaluationWindowMutation } from '~/features/admin-milestone-review/queries';

import * as styles from './AdminMilestoneEvaluationWindowDialog.css';

type DateTimeDraft = { date: string; time: string };
type DateValue = `${number}${number}${number}${number}-${number}${number}-${number}${number}`;

function toDraft(value: string | null | undefined): DateTimeDraft {
  const match = value ? /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(value) : null;
  return match
    ? { date: match[1] ?? '', time: match[2] ?? '' }
    : { date: '', time: '' };
}

function DateTimeFields({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (next: DateTimeDraft) => void;
  value: DateTimeDraft;
}) {
  return (
    <div className={styles.fieldRow}>
      <DateInput
        hasClear
        label={`${label} 날짜`}
        onChange={date => onChange({ ...value, date: date ?? '' })}
        placeholder='날짜 선택'
        value={value.date ? (value.date as DateValue) : undefined}
        width='100%'
      />
      <TimeInput
        hasClear
        hourFormat='24h'
        increment={5}
        label={`${label} 시간`}
        onChange={time => onChange({ ...value, time: time ?? '' })}
        value={value.time ? (value.time as TimeInputProps['value']) : undefined}
        width='100%'
      />
    </div>
  );
}

/**
 * Edits only the 발표 평가 기간 through the dedicated evaluation-window API.
 * The full milestone PUT replaces the whole schedule; this keeps the rest of
 * the schedule untouched and lets an admin remove the window as well.
 */
export default function AdminMilestoneEvaluationWindowDialog({
  isOpen,
  milestone,
  onClose,
  sectionId,
}: {
  isOpen: boolean;
  milestone: AdminSectionMilestoneDto;
  onClose: () => void;
  sectionId: string;
}) {
  const mutation = useUpdateAdminSectionMilestoneEvaluationWindowMutation();
  const [opensAt, setOpensAt] = useState(() =>
    toDraft(milestone.schedule.evaluationOpensAt),
  );
  const [closesAt, setClosesAt] = useState(() =>
    toDraft(milestone.schedule.evaluationClosesAt),
  );
  const [formError, setFormError] = useState<string>();
  const hasExistingWindow = Boolean(
    milestone.schedule.evaluationOpensAt &&
    milestone.schedule.evaluationClosesAt,
  );

  async function submit(input: Parameters<typeof mutation.mutateAsync>[0]['input']) {
    setFormError(undefined);
    try {
      await mutation.mutateAsync({
        input,
        milestoneId: String(milestone.id),
        sectionId,
      });
      onClose();
    } catch (error) {
      setFormError(
        formatAdminMilestoneRequestError(toAdminMilestoneRequestError(error)),
      );
    }
  }

  function handleSave() {
    const evaluationOpensAt = toAdminMilestoneDateTime(opensAt);
    const evaluationClosesAt = toAdminMilestoneDateTime(closesAt);
    if (!evaluationOpensAt || !evaluationClosesAt) {
      setFormError('평가 시작·종료 일시를 모두 입력해주세요.');
      return;
    }
    try {
      assertAdminMilestoneScheduleOrder({
        dueAt: milestone.schedule.dueAt ?? '',
        evaluationClosesAt,
        evaluationOpensAt,
        lateSubmissionUntil: milestone.schedule.lateSubmissionUntil ?? undefined,
        revisionUntil: milestone.schedule.revisionUntil ?? undefined,
      });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : '평가 기간을 확인해주세요.',
      );
      return;
    }
    void submit({ evaluationClosesAt, evaluationOpensAt });
  }

  return (
    <Dialog
      aria-label='발표 평가 기간 설정'
      isOpen={isOpen}
      onOpenChange={open => {
        if (!open) onClose();
      }}
      purpose='form'
      width={560}
    >
      <div className={styles.content}>
        <Heading level={2}>발표 평가 기간 설정</Heading>
        <Text color='secondary'>
          학생이 다른 팀의 발표를 평가할 수 있는 기간입니다. 자료 제출 마감(
          {formatAdminMilestoneDate(milestone.schedule.dueAt)})
          {milestone.schedule.lateSubmissionUntil
            ? `과 지각 제출 마감(${formatAdminMilestoneDate(milestone.schedule.lateSubmissionUntil)})`
            : ''}{' '}
          이후에 시작해야 합니다.
        </Text>
        <DateTimeFields label='평가 시작' onChange={setOpensAt} value={opensAt} />
        <DateTimeFields label='평가 종료' onChange={setClosesAt} value={closesAt} />
        {formError ? (
          <Text role='alert' type='supporting'>
            {formError}
          </Text>
        ) : null}
        <HStack gap={2} justify='end'>
          {hasExistingWindow ? (
            <Button
              isDisabled={mutation.isPending}
              label='평가 기간 해제'
              onClick={() => void submit({ clearEvaluationWindow: true })}
              variant='secondary'
            />
          ) : null}
          <Button
            isDisabled={mutation.isPending}
            label='취소'
            onClick={onClose}
            variant='secondary'
          />
          <Button
            isDisabled={mutation.isPending}
            isLoading={mutation.isPending}
            label='저장'
            onClick={handleSave}
          />
        </HStack>
      </div>
    </Dialog>
  );
}
