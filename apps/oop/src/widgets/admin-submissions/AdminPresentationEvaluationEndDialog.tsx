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
  formatAdminMilestoneRequestError,
  toAdminMilestoneRequestError,
} from '~/features/admin-milestone-review/model';
import {
  useAdminProfessorPresentationEvaluationStatusesQuery,
  useCloseAdminPresentationEvaluationMutation,
} from '~/features/admin-milestone-review/queries';

import * as styles from './AdminPresentationEvaluationEndDialog.css';

export function AdminPresentationEvaluationEndDialog({
  isOpen,
  milestone,
  onClose,
  onWindowUpdated,
  sectionId,
  teams,
  canViewProfessorEvaluations,
}: {
  canViewProfessorEvaluations: boolean;
  isOpen: boolean;
  milestone: AdminSectionMilestoneDto;
  onClose: () => void;
  onWindowUpdated: () => void;
  sectionId: string;
  teams: Array<{
    presentationOrder: number | null;
    teamId: number;
    teamName: string;
  }>;
}) {
  const mutation = useCloseAdminPresentationEvaluationMutation();
  const professorEvaluationStatuses =
    useAdminProfessorPresentationEvaluationStatusesQuery(
      sectionId,
      String(milestone.id),
      teams,
      isOpen && canViewProfessorEvaluations,
    );
  const [formError, setFormError] = useState<string>();

  const unevaluatedTeams = professorEvaluationStatuses.data
    .filter(team => team.submittedAt === null)
    .sort(
      (left, right) =>
        (left.presentationOrder ?? Number.POSITIVE_INFINITY) -
          (right.presentationOrder ?? Number.POSITIVE_INFINITY) ||
        left.teamName.localeCompare(right.teamName, 'ko'),
    );

  useEffect(() => {
    if (!isOpen) setFormError(undefined);
  }, [isOpen]);

  function handleClose() {
    setFormError(undefined);
    onClose();
  }

  if (!isOpen) return null;

  async function handleEnd() {
    if (mutation.isPending) return;

    setFormError(undefined);
    try {
      await mutation.mutateAsync({
        milestoneId: String(milestone.id),
        sectionId,
      });
      onWindowUpdated();
      onClose();
    } catch (error) {
      const requestError = toAdminMilestoneRequestError(error);
      setFormError(
        requestError.code === 'MILESTONE_EVALUATION_WINDOW_CONFLICT'
          ? '평가가 이미 종료되었거나 아직 시작되지 않았습니다. 최신 상태를 확인해 주세요.'
          : formatAdminMilestoneRequestError(requestError),
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
        {canViewProfessorEvaluations ? (
          professorEvaluationStatuses.isPending ? (
            <Text aria-live='polite' role='status'>
              교수자 평가 현황을 확인하는 중입니다.
            </Text>
          ) : professorEvaluationStatuses.isError ? (
            <Text role='alert'>
              미평가 팀을 확인하지 못했습니다. 종료 전 발표 자료 보기·평가
              화면에서 평가 현황을 확인해 주세요.
            </Text>
          ) : unevaluatedTeams.length > 0 ? (
            <VStack gap={2}>
              <Text weight='medium'>
                교수자 평가 미저장 {unevaluatedTeams.length}팀
              </Text>
              <ul className={styles.unevaluatedTeams}>
                {unevaluatedTeams.map(team => (
                  <li key={team.teamId}>
                    {team.presentationOrder
                      ? `${team.presentationOrder}번째 · `
                      : ''}
                    {team.teamName}
                  </li>
                ))}
              </ul>
              <Text color='secondary' type='supporting'>
                지금 종료해도 저장된 평가 내용은 유지됩니다. 이 팀들을
                평가하려면 종료 후 평가를 재개해야 합니다.
              </Text>
            </VStack>
          ) : (
            <Text role='status'>모든 팀의 교수자 평가가 저장되었습니다.</Text>
          )
        ) : (
          <Text color='secondary' type='supporting'>
            교수자 평가 현황은 담당 교수 계정에서 확인할 수 있습니다.
          </Text>
        )}
        {formError ? <Text role='alert'>{formError}</Text> : null}
        <HStack gap={2} justify='end'>
          <Button
            isDisabled={mutation.isPending}
            label='취소'
            onClick={handleClose}
            variant='secondary'
          />
          <Button
            isDisabled={
              mutation.isPending ||
              (canViewProfessorEvaluations &&
                professorEvaluationStatuses.isPending)
            }
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
