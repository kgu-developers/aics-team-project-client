import type { SectionResponse } from '@aics/core';
import { Button } from '@aics/design-system';
import { Navigate } from '@tanstack/react-router';
import { useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import {
  resolveContactVisibility,
  resolveLiveTeamAssignmentStage,
  toTeamAssignmentProjection,
} from './liveTeamAssignment';
import { isValidPositiveTeamId, useTeamKickoffQuery } from './queries';
import { ResultAnnouncement, TeamSummary } from './result';
import LiveFirstMeeting from './result/LiveFirstMeeting';
import { useContactWindowClock } from './useContactWindowClock';

export default function AssignedTeamFlow({
  section,
  teamId,
  teamOnly,
}: {
  section: SectionResponse;
  teamId: string;
  teamOnly: boolean;
}) {
  const [isFirstMeeting, setIsFirstMeeting] = useState(false);
  const query = useTeamKickoffQuery(teamId);
  const now = useContactWindowClock(
    section.contactVisibleFrom,
    section.contactVisibleUntil,
  );

  if (!isValidPositiveTeamId(teamId)) {
    return <p role='alert'>배정된 팀 ID를 확인할 수 없습니다.</p>;
  }
  if (query.isPending)
    return <p role='status'>배정된 팀 정보를 확인하는 중입니다.</p>;
  if (query.isError || !query.data || String(query.data.id) !== teamId) {
    return (
      <section>
        <p role='alert'>배정된 팀 정보를 확인하지 못했어요.</p>
        <Button
          label='다시 확인'
          onClick={() => void query.refetch()}
          variant='secondary'
        />
      </section>
    );
  }
  const stage = resolveLiveTeamAssignmentStage(section, query.data, now);
  const projection = toTeamAssignmentProjection(
    section,
    query.data,
    stage === 'contactClosed' ? 'firstMeeting' : stage,
    now,
  );
  if (teamOnly) return <TeamSummary projection={projection} />;
  if (stage === 'completed')
    return <Navigate replace to={ROUTES.STUDENT.HOME} />;
  const canContinue = stage !== 'result';
  if (!isFirstMeeting || !canContinue) {
    return (
      <ResultAnnouncement
        projection={projection}
        isContinueDisabled={!canContinue}
        onContinue={() => setIsFirstMeeting(true)}
      />
    );
  }
  return (
    <LiveFirstMeeting
      projection={projection}
      contactVisibility={resolveContactVisibility(section, now)}
    />
  );
}
