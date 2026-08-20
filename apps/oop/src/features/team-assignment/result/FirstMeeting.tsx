import type { TeamAssignmentPhase, TeamAssignmentProjection } from '@aics/core';
import {
  Button,
  Dialog,
  Heading,
  HStack,
  Text,
  VStack,
} from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { useConfirmTeamLeaderMutation } from '../queries';
import * as styles from '../TeamAssignmentFlow.css';
import { TeamMemberTable } from './TeamMemberTable';

type FirstMeetingProps = { projection: TeamAssignmentProjection };

export function FirstMeeting({ projection }: FirstMeetingProps) {
  const confirmTeamLeader = useConfirmTeamLeaderMutation();
  const navigate = useNavigate();
  const developmentPreview = import.meta.env.DEV
    ? (new URLSearchParams(window.location.search).get(
        'teamAssignmentPreview',
      ) as TeamAssignmentPhase | null)
    : null;
  const [confirming, setConfirming] = useState(false);
  const [requestError, setRequestError] = useState<string>();
  const team = projection.assignedTeam;
  const leaderActionAvailable =
    projection.leaderConfirmation?.isActionAvailable ?? false;
  const leaderUnavailableReason =
    projection.leaderConfirmation?.unavailableReason ??
    '팀장 확정 기간이 종료되었습니다.';

  if (!team) return <p>팀 정보를 찾을 수 없습니다.</p>;

  async function confirmLeader() {
    setRequestError(undefined);
    try {
      await confirmTeamLeader.mutateAsync({
        developmentPreview: developmentPreview ?? undefined,
        input: { sectionId: projection.sectionId, teamId: team!.id },
      });
      setConfirming(false);
      await navigate({ to: ROUTES.STUDENT.HOME, replace: true });
    } catch {
      setRequestError(
        '다른 팀원이 이미 팀장을 확정했거나 기간이 종료되었습니다.',
      );
      setConfirming(false);
    }
  }

  return (
    <section className={styles.page} aria-labelledby='first-meeting-heading'>
      <div className={styles.resultContent}>
        <h1 id='first-meeting-heading'>
          서로 연락처를 저장하고, 팀장을 선정해주세요!
        </h1>
        <p>이 화면을 벗어나면 연락처는 볼 수 없어요.</p>
        <TeamMemberTable members={team.members} variant='firstMeeting' />
        {leaderActionAvailable ? (
          <div className={`${styles.actions} ${styles.centeredActions}`}>
            <Button
              label='팀원이에요'
              onClick={() => void navigate({ to: ROUTES.STUDENT.HOME })}
              variant='secondary'
            />
            <Button
              label='내가 팀장입니다'
              onClick={() => setConfirming(true)}
              variant='primary'
            />
          </div>
        ) : (
          <div className={styles.unavailableAction}>
            <p>{leaderUnavailableReason}</p>
            <Button
              label='학생 홈으로 이동'
              onClick={() => void navigate({ to: ROUTES.STUDENT.HOME })}
              variant='secondary'
            />
          </div>
        )}
      </div>
      {requestError ? <p role='alert'>{requestError}</p> : null}
      <Dialog
        aria-label='팀장 확정 확인'
        isOpen={confirming}
        onOpenChange={setConfirming}
        purpose='form'
      >
        <VStack gap={4}>
          <VStack gap={2}>
            <Heading level={2}>팀장이신가요?</Heading>
            <Text color='secondary'>
              팀 중 한 명만 해당 단계를 진행할 수 있으며, 확정 뒤에는 수정하기
              어렵습니다.
            </Text>
          </VStack>
          <HStack gap={2} justify='end'>
            <Button
              label='취소'
              onClick={() => setConfirming(false)}
              variant='secondary'
            />
            <Button
              isLoading={confirmTeamLeader.isPending}
              label='확정'
              onClick={() => void confirmLeader()}
              variant='primary'
            />
          </HStack>
        </VStack>
      </Dialog>
    </section>
  );
}
