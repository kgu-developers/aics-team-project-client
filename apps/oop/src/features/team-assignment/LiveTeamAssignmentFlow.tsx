import { Button } from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { useEffect, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';
import StudentContextState from '~/features/section/StudentContextState';
import { useStudentContext } from '~/features/section/useStudentContext';

import AssignedTeamFlow from './AssignedTeamFlow';
import { toTeamResultReleaseAt } from './liveTeamAssignment';
import * as styles from './LiveTeamAssignmentFlow.css';
import OnboardingRecovery from './OnboardingRecovery';
import {
  useLivePreSurveyProjectionQuery,
  useMyTeamAssignmentSurveyQuery,
  useTeamAssignmentWaitingPoll,
} from './queries';
import ResultWaiting from './ResultWaiting';
import { SurveyForm } from './survey/SurveyForm';

export default function LiveTeamAssignmentFlow({
  teamOnly = false,
}: {
  teamOnly?: boolean;
}) {
  const authenticated = useAuthStore(selectHasAuthenticatedSession);
  const clearSession = useAuthStore(state => state.clearSession);
  const navigate = useNavigate();
  const context = useStudentContext();
  const { section, teamId } = context;
  const [editingSectionId, setEditingSectionId] = useState<number>();
  const surveyQuery = useMyTeamAssignmentSurveyQuery(
    authenticated && context.status === 'no-team' ? section?.id : undefined,
  );
  const surveyNotFound =
    surveyQuery.isError &&
    isAxiosError(surveyQuery.error) &&
    surveyQuery.error.response?.status === 404;
  // A preferred-peer request (including acceptance) is not a survey submission.
  // Only the current student's explicit /me submission timestamp completes it.
  const hasSubmittedSurvey =
    typeof surveyQuery.data?.submittedAt === 'string' &&
    surveyQuery.data.submittedAt.trim().length > 0;
  const isEditingSurvey =
    !hasSubmittedSurvey || editingSectionId === section?.id;
  const shouldLoadPartnerRequests =
    authenticated &&
    context.status === 'no-team' &&
    (surveyNotFound || Boolean(surveyQuery.data));
  const projectionQuery = useLivePreSurveyProjectionQuery(
    authenticated && context.status === 'no-team' ? section?.id : undefined,
    surveyQuery.data,
    shouldLoadPartnerRequests,
  );
  const shouldShowSurvey =
    isEditingSurvey || Boolean(projectionQuery.data?.incomingPartnerRequest);
  const isWaitingForAssignment =
    authenticated &&
    context.status === 'no-team' &&
    hasSubmittedSurvey &&
    !shouldShowSurvey;
  useTeamAssignmentWaitingPoll(isWaitingForAssignment);

  useEffect(() => {
    if (surveyNotFound && section) setEditingSectionId(section.id);
  }, [section, surveyNotFound]);
  const recovery = (description: string, retry?: () => void) => (
    <OnboardingRecovery
      title='팀 온보딩 상태를 확인하지 못했어요'
      description={description}
      onRetry={retry}
      onRelogin={() => {
        clearSession();
        void navigate({ to: ROUTES.LOGIN });
      }}
    />
  );

  if (!authenticated || context.identity.isError) {
    return recovery(
      '로그인 정보를 확인해 주세요.',
      authenticated ? () => void context.retry() : undefined,
    );
  }

  if (
    !section ||
    (context.status !== 'ready' && context.status !== 'no-team')
  ) {
    return <StudentContextState context={context} />;
  }

  return (
    <section className={styles.flow}>
      <StudentContextState context={context} sectionOnly />
      {teamId ? (
        <AssignedTeamFlow
          key={`${section.id}:${teamId}`}
          section={section}
          teamId={teamId}
          teamOnly={teamOnly}
        />
      ) : surveyQuery.isPending ? (
        <p>사전 설문 제출 상태를 확인하는 중입니다.</p>
      ) : surveyQuery.isError && !surveyNotFound ? (
        recovery(
          '사전 설문 제출 상태를 확인하지 못했어요.',
          () => void surveyQuery.refetch(),
        )
      ) : projectionQuery.isPending ? (
        <p>파트너 신청 상태를 확인하는 중입니다.</p>
      ) : projectionQuery.isError || !projectionQuery.data ? (
        recovery(
          '파트너 신청 상태를 확인하지 못했어요.',
          () => void projectionQuery.refetch(),
        )
      ) : shouldShowSurvey ? (
        <SurveyForm
          key={section.id}
          onSubmitted={() => setEditingSectionId(undefined)}
          partnerRequestMode='live'
          preferredPeerStatus={surveyQuery.data?.preferredPeerStatus}
          preferredPeerUserId={surveyQuery.data?.preferredPeerUserId}
          preSurveySectionId={section.id}
          projection={projectionQuery.data}
        />
      ) : (
        <ResultWaiting
          resultReleasesAt={toTeamResultReleaseAt(section.contactVisibleFrom)}
        />
      )}
      {teamOnly && !teamId ? (
        <Button
          label='팀 배정 상태 확인'
          onClick={() => void navigate({ to: ROUTES.ONBOARDING.TEAM })}
          variant='secondary'
        />
      ) : null}
    </section>
  );
}
