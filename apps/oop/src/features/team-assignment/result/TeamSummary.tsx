import type { TeamAssignmentProjection } from '@aics/core';
import { Button, HStack } from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

import { formatTeamAssignmentDate } from '../formatTeamAssignmentDate';
import * as styles from '../TeamAssignmentFlow.css';
import { TeamMemberTable } from './TeamMemberTable';

type TeamSummaryProps = {
  isResult?: boolean;
  isContinueDisabled?: boolean;
  onContinue?: () => void;
  projection: TeamAssignmentProjection;
};

const mockDevelopmentMode = isMockDevelopmentMode(
  import.meta.env.DEV,
  import.meta.env.VITE_ENABLE_MSW,
);

export function TeamSummary({
  isResult = false,
  isContinueDisabled = false,
  onContinue,
  projection,
}: TeamSummaryProps) {
  const navigate = useNavigate();
  const team = projection.assignedTeam;

  if (!team) return <p>배정된 팀이 없습니다.</p>;
  const leader = team.members.find(member => member.id === team.leaderId);

  const assignedTeamName =
    team.name ??
    (team.groupNumber === undefined
      ? `팀 ${team.id}`
      : `${team.groupNumber}조`);

  return (
    <section className={styles.page} aria-labelledby='assigned-team-heading'>
      <div className={styles.resultContent}>
        <h1 id='assigned-team-heading'>
          {isResult ? `${assignedTeamName}에 배정되었어요!` : '내 팀'}
        </h1>
        {isResult ? (
          <p>
            {projection.window.nextAvailableAt
              ? `다음 단계는 ${formatTeamAssignmentDate(projection.window.nextAvailableAt)}에 진행됩니다.`
              : '다음 단계 일정은 담당 조교의 안내를 확인해 주세요.'}
          </p>
        ) : null}
        {!isResult ? (
          <p>
            팀장:{' '}
            {leader ? `${leader.name} (${leader.studentNumber})` : '미확정'}
          </p>
        ) : null}
        <TeamMemberTable members={team.members} variant='assignment' />
        {isResult ? (
          <>
            <HStack justify='center'>
              <Button
                isDisabled={isContinueDisabled || !onContinue}
                label='다음'
                onClick={onContinue}
                size='md'
                variant='secondary'
              />
            </HStack>
            {mockDevelopmentMode && !onContinue ? (
              <div className={`${styles.actions} ${styles.centeredActions}`}>
                <Button
                  label='개발용: 첫 만남 단계 보기'
                  onClick={() =>
                    void navigate({
                      search: { teamAssignmentPreview: 'firstMeeting' },
                      to: ROUTES.ONBOARDING.TEAM,
                    })
                  }
                  variant='secondary'
                />
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
