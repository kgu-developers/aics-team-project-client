import type { TeamAssignmentProjection } from '@aics/core';
import { Button } from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { formatTeamAssignmentDate } from '../formatTeamAssignmentDate';
import * as styles from '../TeamAssignmentFlow.css';
import { TeamMemberTable } from './TeamMemberTable';

type TeamSummaryProps = {
  isResult?: boolean;
  projection: TeamAssignmentProjection;
};

export function TeamSummary({
  isResult = false,
  projection,
}: TeamSummaryProps) {
  const navigate = useNavigate();
  const team = projection.assignedTeam;

  if (!team) return <p>배정된 팀이 없습니다.</p>;

  return (
    <section className={styles.page} aria-labelledby='assigned-team-heading'>
      <div className={styles.resultContent}>
        <h1 id='assigned-team-heading'>
          {isResult ? `${team.groupNumber}조로 배정되었어요!` : '내 팀'}
        </h1>
        {isResult ? (
          <p>
            다음 단계는{' '}
            {formatTeamAssignmentDate(projection.window.nextAvailableAt)}에
            진행됩니다.
          </p>
        ) : null}
        <TeamMemberTable members={team.members} variant='assignment' />
        {isResult ? (
          <>
            <Button isDisabled label='다음 단계 대기 중' variant='secondary' />
            {import.meta.env.DEV ? (
              <div className={`${styles.actions} ${styles.centeredActions}`}>
                <Button
                  label='개발용: 첫 만남 단계 보기'
                  onClick={() =>
                    void navigate({
                      search: { teamAssignmentPreview: 'firstMeeting' },
                      to: ROUTES.ONBOARDING.FIRST_MEETING,
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
