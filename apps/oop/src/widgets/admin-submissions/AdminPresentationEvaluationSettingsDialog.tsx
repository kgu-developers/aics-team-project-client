import type { AdminPresentationEvaluationTeamDto } from '@aics/api-client';
import {
  Button,
  DateInput,
  Dialog,
  Heading,
  HStack,
  Selector,
  SelectorOption,
  Text,
  VStack,
} from '@aics/design-system';
import { useEffect, useMemo, useState } from 'react';

import { useUpdateAdminPresentationEvaluationSettingsMutation } from '~/features/admin-milestone-review/queries';

import * as styles from './AdminPresentationEvaluationSettingsDialog.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  teams: AdminPresentationEvaluationTeamDto[];
  startsAt: string | null;
  endsAt: string | null;
  sectionId: string;
};

function toDatePart(value: string | null) {
  return value?.slice(0, 10) ?? '';
}

function toTimePart(value: string | null) {
  return value?.match(/T(\d{2}:\d{2})/)?.[1] ?? '';
}

function toIsoDateTime(date: string, time: string) {
  return date && time ? `${date}T${time}:00+09:00` : '';
}

function asDateInputValue(value: string) {
  return value ? (value as `${number}${number}${number}${number}-${number}${number}-${number}${number}`) : undefined;
}

export function AdminPresentationEvaluationSettingsDialog({
  isOpen,
  onClose,
  teams,
  startsAt,
  endsAt,
  sectionId,
}: Props) {
  const saveMutation = useUpdateAdminPresentationEvaluationSettingsMutation();
  const initialOrders = useMemo(
    () =>
      Object.fromEntries(
        teams.map((team, index) => [
          team.teamId,
          team.presentationOrder ?? index + 1,
        ]),
      ),
    [teams],
  );
  const [orders, setOrders] = useState<Record<string, number>>(initialOrders);
  const [startDate, setStartDate] = useState(toDatePart(startsAt));
  const [startTime, setStartTime] = useState(toTimePart(startsAt));
  const [endDate, setEndDate] = useState(toDatePart(endsAt));
  const [endTime, setEndTime] = useState(toTimePart(endsAt));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setOrders(initialOrders);
    setStartDate(toDatePart(startsAt));
    setStartTime(toTimePart(startsAt));
    setEndDate(toDatePart(endsAt));
    setEndTime(toTimePart(endsAt));
    setError(null);
  }, [initialOrders, isOpen, startsAt, endsAt]);

  if (!isOpen) return null;

  const orderOptions = teams.map((_, index) => ({
    label: `${index + 1}번`,
    value: String(index + 1),
  }));

  function handleSave() {
    const values = teams.map(team => orders[team.teamId]);
    if (new Set(values).size !== values.length) {
      setError('발표 순서는 중복될 수 없습니다.');
      return;
    }
    const start = toIsoDateTime(startDate, startTime);
    const end = toIsoDateTime(endDate, endTime);
    if (!start || !end) {
      setError('평가 시작일시와 종료일시를 입력해 주세요.');
      return;
    }
    if (start >= end) {
      setError('종료일시는 시작일시보다 늦어야 합니다.');
      return;
    }
    setError(null);
    saveMutation.mutate(
      {
        sectionId,
        teams: teams.map((team, index) => ({
          teamId: team.teamId,
          presentationOrder: orders[team.teamId] ?? index + 1,
        })),
        startsAt: start,
        endsAt: end,
      },
      {
        onSuccess: onClose,
        onError: () => setError('저장하지 못했습니다. 다시 시도해 주세요.'),
      },
    );
  }

  return (
    <Dialog
      aria-label='발표 순서 및 평가 기간 설정'
      isOpen={isOpen}
      onOpenChange={nextIsOpen => {
        if (!nextIsOpen) onClose();
      }}
      purpose='info'
      width={560}
    >
      <VStack className={styles.content} gap={4}>
        <Heading level={2}>순서 배정 및 평가</Heading>
        <Text color='secondary' type='supporting'>
          팀별 발표 순서와 학생 평가 기간을 설정해 주세요.
        </Text>
        <VStack gap={3}>
          {teams.map(team => (
            <HStack
              align='center'
              className={styles.teamRow}
              gap={3}
              key={team.teamId}
            >
              <Text className={styles.teamName}>{team.teamName}</Text>
              <Selector
                aria-label={`${team.teamName} 발표 순서`}
                label='발표 순서'
                onChange={value =>
                  setOrders(current => ({
                    ...current,
                    [team.teamId]: Number(value),
                  }))
                }
                options={orderOptions}
                renderOption={option => (
                  <SelectorOption label={option.label ?? option.value} />
                )}
                value={String(orders[team.teamId])}
                width={120}
              />
            </HStack>
          ))}
        </VStack>
        <VStack gap={2}>
          <div className={styles.dateTimeRow}>
            <DateInput
              label='시작 날짜'
              onChange={value => setStartDate(value ?? '')}
              value={asDateInputValue(startDate)}
            />
            <label>
              <Text type='supporting'>시작 시간</Text>
              <input aria-label='발표 평가 시작 시간' className={styles.timeInput} onChange={event => setStartTime(event.target.value)} type='time' value={startTime} />
            </label>
          </div>
          <div className={styles.dateTimeRow}>
            <DateInput
              label='종료 날짜'
              onChange={value => setEndDate(value ?? '')}
              value={asDateInputValue(endDate)}
            />
            <label>
              <Text type='supporting'>종료 시간</Text>
              <input aria-label='발표 평가 종료 시간' className={styles.timeInput} onChange={event => setEndTime(event.target.value)} type='time' value={endTime} />
            </label>
          </div>
        </VStack>
        {error ? <Text className={styles.errorText}>{error}</Text> : null}
        <HStack justify='end' gap={2}>
          <Button
            label='취소'
            onClick={onClose}
            type='button'
            variant='secondary'
          />
          <Button
            isDisabled={saveMutation.isPending}
            label={saveMutation.isPending ? '저장 중...' : '저장'}
            onClick={handleSave}
            type='button'
          />
        </HStack>
      </VStack>
    </Dialog>
  );
}
