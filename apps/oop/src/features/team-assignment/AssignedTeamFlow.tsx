import type { SectionResponse } from '@aics/core';
import { Button } from '@aics/design-system';
import { Navigate } from '@tanstack/react-router';
import { useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import {
  resolveContactVisibility,
  resolveLiveTeamAssignmentStage,
  toTeamAssignmentProjection,
  toTeamResultReleaseAt,
} from './liveTeamAssignment';
import { isValidPositiveTeamId, useTeamKickoffQuery } from './queries';
import { ResultAnnouncement, TeamSummary } from './result';
import LiveFirstMeeting from './result/LiveFirstMeeting';
import ResultWaiting from './ResultWaiting';
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
  const now = useContactWindowClock(
    section.contactVisibleFrom,
    section.contactVisibleUntil,
  );
  const contactVisibility = resolveContactVisibility(section, now);

  if (contactVisibility === 'upcoming') {
    return (
      <ResultWaiting
        resultReleasesAt={toTeamResultReleaseAt(section.contactVisibleFrom)}
      />
    );
  }

  return (
    <VisibleAssignedTeamFlow
      contactVisibility={contactVisibility}
      now={now}
      section={section}
      teamId={teamId}
      teamOnly={teamOnly}
    />
  );
}

function VisibleAssignedTeamFlow({
  contactVisibility,
  now,
  section,
  teamId,
  teamOnly,
}: {
  contactVisibility: ReturnType<typeof resolveContactVisibility>;
  now: number;
  section: SectionResponse;
  teamId: string;
  teamOnly: boolean;
}) {
  const [isFirstMeeting, setIsFirstMeeting] = useState(false);
  const query = useTeamKickoffQuery(teamId);

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
  if (teamOnly)
    return <TeamSummary projection={projection} showBackNavigation />;
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
      contactVisibility={contactVisibility}
    />
  );
}
