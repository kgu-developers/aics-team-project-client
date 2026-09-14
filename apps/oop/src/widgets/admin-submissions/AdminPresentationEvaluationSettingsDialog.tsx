import {
  Button,
  Dialog,
  Heading,
  HStack,
  Selector,
  SelectorOption,
  Text,
  TextInput,
  VStack,
} from '@aics/design-system';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  useAdminTeamEvaluationCriteriaQuery,
  useCreateAdminTeamEvaluationCriterionMutation,
  useUpdatePresentationOrderMutation,
} from '~/features/admin-milestone-review/queries';
import { adminPresentationEvaluationKeys } from '~/features/admin-milestone-review/queries/adminPresentationEvaluationKeys';

import * as styles from './AdminPresentationEvaluationSettingsDialog.css';
import { validatePresentationOrders } from './adminPresentationOrder';

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
  const queryClient = useQueryClient();
  const saveMutation = useUpdatePresentationOrderMutation();
  const criteriaQuery = useAdminTeamEvaluationCriteriaQuery(sectionId);
  const createCriterionMutation =
    useCreateAdminTeamEvaluationCriterionMutation();
  const initialOrders = useMemo(
    () =>
      Object.fromEntries(
        teams.map(team => [team.teamId, team.presentationOrder]),
      ),
    [teams],
  );
  const [orders, setOrders] =
    useState<Record<string, number | null>>(initialOrders);
  const [error, setError] = useState<string | null>(null);
  const [criterionTitle, setCriterionTitle] = useState('');
  const [criterionMaxScore, setCriterionMaxScore] = useState('');
  const [criterionError, setCriterionError] = useState<string | null>(null);
  const initializedContext = useRef<{
    sectionId: string;
    milestoneId: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      initializedContext.current = null;
      return;
    }
    // Refetches may replace teams; only a new dialog context resets the draft.
    if (
      initializedContext.current?.sectionId === sectionId &&
      initializedContext.current.milestoneId === milestoneId
    ) {
      return;
    }
    initializedContext.current = { sectionId, milestoneId };
    setOrders(initialOrders);
    setError(null);
    setCriterionError(null);
  }, [initialOrders, isOpen, milestoneId, sectionId]);

  if (!isOpen) return null;

  const orderOptions = teams.map((_, index) => ({
    label: `${index + 1}번`,
    value: String(index + 1),
  }));

  function handleSave() {
    if (saveMutation.isPending) return;
    const result = validatePresentationOrders(teams, orders);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    saveMutation.mutate(
      {
        milestoneId,
        sectionId,
        teamOrders: result.teamOrders,
      },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: adminPresentationEvaluationKeys.list(sectionId),
          });
          onClose();
        },
        onError: () => setError('저장하지 못했습니다. 다시 시도해 주세요.'),
      },
    );
  }

  function handleCreateCriterion() {
    if (!criteriaQuery.isSuccess || createCriterionMutation.isPending) return;
    const title = criterionTitle.trim();
    const maxScore = Number(criterionMaxScore);

    if (!title) {
      setCriterionError('평가 항목명을 입력해 주세요.');
      return;
    }
    if (!Number.isInteger(maxScore) || maxScore <= 0) {
      setCriterionError('배점은 1 이상의 정수로 입력해 주세요.');
      return;
    }

    setCriterionError(null);
    createCriterionMutation.mutate(
      {
        input: {
          displayOrder:
            Math.max(
              -1,
              ...criteriaQuery.data.contents.map(
                criterion => criterion.displayOrder,
              ),
            ) + 1,
          maxScore,
          title,
        },
        sectionId,
      },
      {
        onError: () =>
          setCriterionError(
            '평가 항목을 추가하지 못했습니다. 다시 시도해 주세요.',
          ),
        onSuccess: () => {
          setCriterionTitle('');
          setCriterionMaxScore('');
        },
      },
    );
  }

  return (
    <Dialog
      aria-label='발표 평가 설정'
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
                value={
                  orders[team.teamId] == null ? '' : String(orders[team.teamId])
                }
                width={120}
              />
            </HStack>
          ))}
        </VStack>
        <VStack gap={2}>
          <Heading level={3}>평가 항목</Heading>
          <Text color='secondary' type='supporting'>
            평가 항목은 표시 순서대로 학생 발표 평가에 적용됩니다.
          </Text>
          {criteriaQuery.isPending ? (
            <Text aria-live='polite' role='status'>
              평가 항목을 불러오는 중입니다.
            </Text>
          ) : criteriaQuery.isError ? (
            <VStack gap={2}>
              <Text role='alert'>평가 항목을 불러오지 못했습니다.</Text>
              <Button
                label='다시 시도'
                onClick={() => void criteriaQuery.refetch()}
                type='button'
                variant='secondary'
              />
            </VStack>
          ) : criteriaQuery.data?.contents.length ? (
            <VStack gap={1}>
              {criteriaQuery.data.contents.map(criterion => (
                <Text key={criterion.id}>
                  {criterion.displayOrder + 1}. {criterion.title} ·{' '}
                  {criterion.maxScore}점
                </Text>
              ))}
            </VStack>
          ) : (
            <Text color='secondary'>등록된 평가 항목이 없습니다.</Text>
          )}
          <TextInput
            isDisabled={createCriterionMutation.isPending}
            isRequired
            label='평가 항목명'
            onChange={setCriterionTitle}
            value={criterionTitle}
            width='100%'
          />
          <label>
            <Text weight='medium'>배점</Text>
            <input
              aria-label='배점'
              className={styles.timeInput}
              disabled={createCriterionMutation.isPending}
              min='1'
              onChange={event => setCriterionMaxScore(event.target.value)}
              step='1'
              type='number'
              value={criterionMaxScore}
            />
          </label>
          {criterionError ? (
            <Text className={styles.errorText} role='alert'>
              {criterionError}
            </Text>
          ) : null}
          <HStack justify='end'>
            <Button
              isDisabled={
                createCriterionMutation.isPending || !criteriaQuery.isSuccess
              }
              isLoading={createCriterionMutation.isPending}
              label='평가 항목 추가'
              onClick={handleCreateCriterion}
              type='button'
              variant='secondary'
            />
          </HStack>
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
