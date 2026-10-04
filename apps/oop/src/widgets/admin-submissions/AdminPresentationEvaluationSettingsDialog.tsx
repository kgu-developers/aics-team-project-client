import {
  AlertDialog,
  Button,
  Dialog,
  Heading,
  HStack,
  NumberInput,
  Text,
  TextInput,
  VStack,
} from '@aics/design-system';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';

import { seoulInstant } from '~/shared/lib/seoulInstant';

import {
  useAdminTeamEvaluationCriteriaQuery,
  useCreateAdminTeamEvaluationCriterionMutation,
  useRemoveAdminTeamEvaluationCriterionMutation,
  useUpdateAdminTeamEvaluationCriterionMutation,
  useUpdatePresentationOrderMutation,
} from '~/features/admin-milestone-review/queries';
import { adminPresentationEvaluationKeys } from '~/features/admin-milestone-review/queries/adminPresentationEvaluationKeys';

import * as styles from './AdminPresentationEvaluationSettingsDialog.css';
import { validatePresentationOrders } from './adminPresentationOrder';

type Props = {
  evaluationStartsAt: string | null;
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
  evaluationStartsAt,
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
  const updateCriterionMutation =
    useUpdateAdminTeamEvaluationCriterionMutation();
  const removeCriterionMutation =
    useRemoveAdminTeamEvaluationCriterionMutation();
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
  const [editingCriterionId, setEditingCriterionId] = useState<number | null>(
    null,
  );
  const [editingCriterionTitle, setEditingCriterionTitle] = useState('');
  const [editingCriterionMaxScore, setEditingCriterionMaxScore] = useState('');
  const [deleteCandidateId, setDeleteCandidateId] = useState<number | null>(
    null,
  );
  const [evaluationClock, setEvaluationClock] = useState(() => Date.now());
  const [isOrderChangeConfirmationOpen, setIsOrderChangeConfirmationOpen] =
    useState(false);
  const orderInputContextKey = `${sectionId}:${milestoneId}`;
  const initializedContext = useRef<{
    sectionId: string;
    milestoneId: string;
  } | null>(null);
  const evaluationStartsAtInstant = useMemo(
    () => seoulInstant(evaluationStartsAt),
    [evaluationStartsAt],
  );
  const hasInvalidEvaluationStart =
    evaluationStartsAt !== null && Number.isNaN(evaluationStartsAtInstant);
  const isEvaluationLockedAt = (instant: number) =>
    hasInvalidEvaluationStart ||
    (!Number.isNaN(evaluationStartsAtInstant) &&
      instant >= evaluationStartsAtInstant);
  const isEvaluationLocked = isEvaluationLockedAt(evaluationClock);
  const hasEvaluationStartedAt = (instant: number) =>
    !hasInvalidEvaluationStart &&
    !Number.isNaN(evaluationStartsAtInstant) &&
    instant >= evaluationStartsAtInstant;
  const hasEvaluationStarted = hasEvaluationStartedAt(evaluationClock);

  useEffect(() => {
    if (!isOpen || Number.isNaN(evaluationStartsAtInstant)) return;

    const now = Date.now();
    const remaining = evaluationStartsAtInstant - now;
    if (remaining <= 0) {
      setEvaluationClock(current =>
        isEvaluationLockedAt(current) ? current : now,
      );
      return;
    }

    const timer = window.setTimeout(
      () => setEvaluationClock(Date.now()),
      Math.min(remaining + 25, 2_147_483_647),
    );
    return () => window.clearTimeout(timer);
  }, [evaluationClock, evaluationStartsAtInstant, isOpen]);

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
    setEditingCriterionId(null);
    setDeleteCandidateId(null);
    setIsOrderChangeConfirmationOpen(false);
  }, [initialOrders, isOpen, milestoneId, sectionId]);

  if (!isOpen) return null;

  const orderValidation = validatePresentationOrders(teams, orders);

  function getOrderError(teamId: number) {
    const order = orders[teamId];
    if (order == null) return '발표 순서를 입력해 주세요.';
    if (!Number.isInteger(order) || order < 1 || order > teams.length) {
      return `1부터 ${teams.length} 사이의 번호를 입력해 주세요.`;
    }
    const isDuplicated = teams.some(
      team => team.teamId !== teamId && orders[team.teamId] === order,
    );
    return isDuplicated ? '이미 사용 중인 발표 순서입니다.' : undefined;
  }

  function savePresentationOrders(
    teamOrders: Array<{ teamId: number; order: number }>,
  ) {
    setError(null);
    saveMutation.mutate(
      {
        milestoneId,
        sectionId,
        teamOrders,
      },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: adminPresentationEvaluationKeys.list(sectionId),
          });
          setIsOrderChangeConfirmationOpen(false);
          onClose();
        },
        onError: () => {
          setIsOrderChangeConfirmationOpen(false);
          setError('저장하지 못했습니다. 다시 시도해 주세요.');
        },
      },
    );
  }

  function handleSave() {
    if (saveMutation.isPending) return;
    const result = validatePresentationOrders(teams, orders);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (hasEvaluationStartedAt(Date.now())) {
      setIsOrderChangeConfirmationOpen(true);
      return;
    }
    savePresentationOrders(result.teamOrders);
  }

  function handleConfirmOrderChange() {
    if (saveMutation.isPending) return;
    const result = validatePresentationOrders(teams, orders);
    if (!result.ok) {
      setIsOrderChangeConfirmationOpen(false);
      setError(result.error);
      return;
    }
    savePresentationOrders(result.teamOrders);
  }

  function handleCreateCriterion() {
    if (
      isEvaluationLockedAt(Date.now()) ||
      !criteriaQuery.isSuccess ||
      createCriterionMutation.isPending
    )
      return;
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

  function beginCriterionEdit(criterion: {
    id: number;
    maxScore: number;
    title: string;
  }) {
    setEditingCriterionId(criterion.id);
    setEditingCriterionTitle(criterion.title);
    setEditingCriterionMaxScore(String(criterion.maxScore));
    setDeleteCandidateId(null);
    setCriterionError(null);
  }

  function handleUpdateCriterion() {
    if (
      editingCriterionId === null ||
      isEvaluationLockedAt(Date.now()) ||
      updateCriterionMutation.isPending ||
      !criteriaQuery.data
    )
      return;

    const title = editingCriterionTitle.trim();
    const maxScore = Number(editingCriterionMaxScore);
    const criterion = criteriaQuery.data.contents.find(
      item => item.id === editingCriterionId,
    );
    if (!title) {
      setCriterionError('평가 항목명을 입력해 주세요.');
      return;
    }
    if (!Number.isInteger(maxScore) || maxScore <= 0) {
      setCriterionError('배점은 1 이상의 정수로 입력해 주세요.');
      return;
    }
    if (!criterion) {
      setCriterionError('평가 항목을 다시 불러온 뒤 시도해 주세요.');
      return;
    }

    setCriterionError(null);
    updateCriterionMutation.mutate(
      {
        criterionId: editingCriterionId,
        displayOrder: criterion.displayOrder,
        maxScore,
        sectionId,
        title,
      },
      {
        onError: () =>
          setCriterionError(
            '평가가 시작되었거나 점수가 저장되어 항목을 수정할 수 없습니다. 목록을 다시 확인해 주세요.',
          ),
        onSuccess: () => {
          setEditingCriterionId(null);
          setEditingCriterionTitle('');
          setEditingCriterionMaxScore('');
        },
      },
    );
  }

  function handleRemoveCriterion() {
    if (
      deleteCandidateId === null ||
      isEvaluationLockedAt(Date.now()) ||
      removeCriterionMutation.isPending
    )
      return;

    setCriterionError(null);
    removeCriterionMutation.mutate(
      { criterionId: deleteCandidateId, sectionId },
      {
        onError: () =>
          setCriterionError(
            '평가가 시작되었거나 점수가 저장되어 항목을 삭제할 수 없습니다. 목록을 다시 확인해 주세요.',
          ),
        onSuccess: () => {
          if (editingCriterionId === deleteCandidateId) {
            setEditingCriterionId(null);
            setEditingCriterionTitle('');
            setEditingCriterionMaxScore('');
          }
          setDeleteCandidateId(null);
        },
      },
    );
  }

  return (
    <Dialog
      aria-label='발표 순서·평가 항목 설정'
      isOpen={isOpen}
      onOpenChange={nextIsOpen => {
        if (!nextIsOpen) {
          setIsOrderChangeConfirmationOpen(false);
          onClose();
        }
      }}
      purpose='info'
      width={560}
    >
      <VStack className={styles.content} gap={4}>
        <Heading level={2}>발표 순서·평가 항목 설정</Heading>
        <Text color='secondary' type='supporting'>
          팀별 발표 순서와 학생이 채점할 평가 항목을 여기에서 관리합니다. 평가
          시작은 발표 평가 목록의 발표 평가 시작 버튼에서 진행 시간을 정한 뒤
          확정합니다.
        </Text>
        <VStack gap={3}>
          {hasEvaluationStarted ? (
            <Text color='secondary' role='status' type='supporting'>
              평가 진행 중에도 발표 순서를 변경할 수 있습니다. 저장하면 학생에게
              보이는 발표 순서도 변경됩니다.
            </Text>
          ) : null}
          {teams.length ? (
            teams.map(team => (
              <HStack
                align='center'
                className={styles.teamRow}
                gap={3}
                key={team.teamId}
              >
                <Text className={styles.teamName}>{team.teamName}</Text>
                <NumberInput
                  aria-label={`${team.teamName} 발표 순서`}
                  hasClear
                  isDisabled={saveMutation.isPending}
                  isIntegerOnly
                  key={`${orderInputContextKey}:${team.teamId}`}
                  label='발표 순서'
                  onChange={value =>
                    setOrders(current => ({
                      ...current,
                      [team.teamId]: value,
                    }))
                  }
                  placeholder={`1~${teams.length}`}
                  status={
                    getOrderError(team.teamId)
                      ? {
                          message: getOrderError(team.teamId),
                          type: 'error',
                        }
                      : undefined
                  }
                  value={orders[team.teamId]}
                  width={120}
                />
              </HStack>
            ))
          ) : (
            <Text color='secondary'>발표 순서를 설정할 팀이 없습니다.</Text>
          )}
          {!orderValidation.ok ? (
            <Text className={styles.errorText} role='alert'>
              {orderValidation.error}
            </Text>
          ) : null}
          {error ? (
            <Text className={styles.errorText} role='alert'>
              {error}
            </Text>
          ) : null}
          <HStack justify='end'>
            <Button
              isDisabled={
                saveMutation.isPending ||
                teams.length === 0 ||
                !orderValidation.ok
              }
              label={saveMutation.isPending ? '저장 중...' : '발표 순서 저장'}
              onClick={handleSave}
              type='button'
            />
          </HStack>
        </VStack>
        <VStack gap={2}>
          <Heading level={3}>평가 항목</Heading>
          <Text color='secondary' type='supporting'>
            평가 항목은 표시 순서대로 학생 발표 평가에 적용됩니다.
          </Text>
          {isEvaluationLocked ? (
            <Text color='secondary' role='status' type='supporting'>
              {hasInvalidEvaluationStart
                ? '평가 시작 시각을 확인할 수 없어 평가 항목을 추가할 수 없습니다.'
                : '평가 기간이 시작되어 평가 항목을 추가할 수 없습니다.'}
            </Text>
          ) : null}
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
            <VStack gap={2}>
              {criteriaQuery.data.contents.map(criterion => (
                <HStack
                  align='center'
                  gap={2}
                  key={criterion.id}
                  justify='between'
                >
                  <Text>
                    {criterion.displayOrder + 1}. {criterion.title} ·{' '}
                    {criterion.maxScore}점
                  </Text>
                  <Button
                    isDisabled={
                      isEvaluationLocked ||
                      updateCriterionMutation.isPending ||
                      removeCriterionMutation.isPending
                    }
                    label='수정'
                    onClick={() => beginCriterionEdit(criterion)}
                    type='button'
                    variant='secondary'
                  />
                </HStack>
              ))}
            </VStack>
          ) : (
            <Text color='secondary'>등록된 평가 항목이 없습니다.</Text>
          )}
          {editingCriterionId !== null ? (
            <VStack gap={2}>
              <Heading level={4}>평가 항목 수정</Heading>
              <TextInput
                isDisabled={
                  isEvaluationLocked ||
                  updateCriterionMutation.isPending ||
                  removeCriterionMutation.isPending
                }
                label='평가 항목명'
                onChange={setEditingCriterionTitle}
                value={editingCriterionTitle}
                width='100%'
              />
              <NumberInput
                isDisabled={
                  isEvaluationLocked ||
                  updateCriterionMutation.isPending ||
                  removeCriterionMutation.isPending
                }
                isIntegerOnly
                label='배점'
                min={1}
                onChange={value =>
                  setEditingCriterionMaxScore(String(value ?? ''))
                }
                value={
                  editingCriterionMaxScore === ''
                    ? null
                    : Number(editingCriterionMaxScore)
                }
                width={160}
              />
              <HStack gap={2} justify='end'>
                <Button
                  isDisabled={updateCriterionMutation.isPending}
                  label='취소'
                  onClick={() => {
                    setEditingCriterionId(null);
                    setEditingCriterionTitle('');
                    setEditingCriterionMaxScore('');
                    setDeleteCandidateId(null);
                  }}
                  type='button'
                  variant='secondary'
                />
                <Button
                  isDisabled={
                    isEvaluationLocked || updateCriterionMutation.isPending
                  }
                  isLoading={updateCriterionMutation.isPending}
                  label='수정 저장'
                  onClick={handleUpdateCriterion}
                  type='button'
                />
                <Button
                  isDisabled={
                    isEvaluationLocked || removeCriterionMutation.isPending
                  }
                  label='삭제'
                  onClick={() => setDeleteCandidateId(editingCriterionId)}
                  type='button'
                  variant='destructive'
                />
              </HStack>
              {deleteCandidateId === editingCriterionId ? (
                <VStack gap={2}>
                  <Text role='alert'>
                    이 평가 항목을 삭제할까요? 되돌릴 수 없습니다.
                  </Text>
                  <HStack gap={2} justify='end'>
                    <Button
                      isDisabled={removeCriterionMutation.isPending}
                      label='삭제 취소'
                      onClick={() => setDeleteCandidateId(null)}
                      type='button'
                      variant='secondary'
                    />
                    <Button
                      isLoading={removeCriterionMutation.isPending}
                      label='삭제 확정'
                      onClick={handleRemoveCriterion}
                      type='button'
                      variant='destructive'
                    />
                  </HStack>
                </VStack>
              ) : null}
            </VStack>
          ) : null}
          <TextInput
            isDisabled={isEvaluationLocked || createCriterionMutation.isPending}
            isRequired
            label='평가 항목명'
            onChange={setCriterionTitle}
            value={criterionTitle}
            width='100%'
          />
          <NumberInput
            isDisabled={isEvaluationLocked || createCriterionMutation.isPending}
            isIntegerOnly
            label='배점'
            min={1}
            onChange={value => setCriterionMaxScore(String(value ?? ''))}
            value={criterionMaxScore === '' ? null : Number(criterionMaxScore)}
            width={160}
          />
          {criterionError ? (
            <Text className={styles.errorText} role='alert'>
              {criterionError}
            </Text>
          ) : null}
          <HStack justify='end'>
            <Button
              isDisabled={
                isEvaluationLocked ||
                createCriterionMutation.isPending ||
                !criteriaQuery.isSuccess
              }
              isLoading={createCriterionMutation.isPending}
              label='평가 항목 추가'
              onClick={handleCreateCriterion}
              type='button'
              variant='secondary'
            />
          </HStack>
        </VStack>
        <HStack justify='end' gap={2}>
          <Button
            label='닫기'
            onClick={() => {
              setIsOrderChangeConfirmationOpen(false);
              onClose();
            }}
            type='button'
            variant='secondary'
          />
        </HStack>
      </VStack>
      <AlertDialog
        actionLabel='순서 변경'
        actionVariant='primary'
        cancelLabel='취소'
        description='평가가 진행 중입니다. 저장하면 학생이 보는 발표 순서도 즉시 변경됩니다. 이미 저장된 학생·교수자 평가는 유지됩니다.'
        isActionLoading={saveMutation.isPending}
        isOpen={isOrderChangeConfirmationOpen}
        onAction={handleConfirmOrderChange}
        onOpenChange={nextIsOpen => {
          if (!nextIsOpen) setIsOrderChangeConfirmationOpen(false);
        }}
        title='발표 순서를 변경할까요?'
      />
    </Dialog>
  );
}
