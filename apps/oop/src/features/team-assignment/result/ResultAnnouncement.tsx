import type { TeamAssignmentProjection } from '@aics/core';
import { Button } from '@aics/design-system';
import { useState } from 'react';

import * as styles from '../TeamAssignmentFlow.css';
import { TeamSummary } from './TeamSummary';

type ResultAnnouncementProps = { projection: TeamAssignmentProjection };

export function ResultAnnouncement({ projection }: ResultAnnouncementProps) {
  const [isViewingTeam, setIsViewingTeam] = useState(false);
  const team = projection.assignedTeam;

  if (!team) return <p role='alert'>배정된 팀 정보를 찾을 수 없습니다.</p>;
  if (isViewingTeam) return <TeamSummary isResult projection={projection} />;

  return (
    <section className={styles.page} aria-labelledby='team-result-heading'>
      <div className={styles.centeredStage}>
        <img
          alt=''
          className={styles.illustration}
          src='/team-survey-illustration.svg'
        />
        <h1 className={styles.headline} id='team-result-heading'>
          {team.groupNumber}조로 배정되었어요!
        </h1>
        <p>다음으로 팀원을 확인하고 팀장을 선정하세요.</p>
      </div>
      <div className={`${styles.actions} ${styles.centeredActions}`}>
        <Button
          label='우리 팀 확인하기'
          onClick={() => setIsViewingTeam(true)}
          variant='secondary'
        />
      </div>
    </section>
  );
}
