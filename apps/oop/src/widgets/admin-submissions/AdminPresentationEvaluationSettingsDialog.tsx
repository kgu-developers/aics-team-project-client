import {
  Button,
  Dialog,
  Heading,
  HStack,
  Selector,
  SelectorOption,
  Text,
  VStack,
} from '@aics/design-system';
import { useEffect, useMemo, useState } from 'react';

import { useUpdatePresentationOrderMutation } from '~/features/admin-milestone-review/queries';

import * as styles from './AdminPresentationEvaluationSettingsDialog.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  teams: Array<{
    presentationOrder: number | null;
    teamId: number;
    teamName: string;
  }>;
  milestoneId: string;
  sectionId: string;
};

export function AdminPresentationEvaluationSettingsDialog({
  isOpen,
  onClose,
  teams,
  milestoneId,
  sectionId,
}: Props) {
  const saveMutation = useUpdatePresentationOrderMutation();
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setOrders(initialOrders);
    setError(null);
  }, [initialOrders, isOpen]);

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
    setError(null);
    saveMutation.mutate(
      {
        milestoneId,
        sectionId,
        teamOrders: teams.map((team, index) => ({
          teamId: team.teamId,
          order: orders[team.teamId] ?? index + 1,
        })),
      },
      {
        onSuccess: onClose,
        onError: () => setError('저장하지 못했습니다. 다시 시도해 주세요.'),
      },
    );
  }

  return (
    <Dialog
      aria-label='발표 순서 설정'
      isOpen={isOpen}
      onOpenChange={nextIsOpen => {
        if (!nextIsOpen) onClose();
      }}
      purpose='info'
      width={560}
    >
      <VStack className={styles.content} gap={4}>
        <Heading level={2}>발표 순서 설정</Heading>
        <Text color='secondary' type='supporting'>
          팀별 발표 순서를 설정해 주세요. 평가 기간은 마일스톤 설정에서
          수정합니다.
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
