import type {
  CurrentUserSection,
  TeamAssignmentPhase,
  TeamAssignmentProjection,
} from '@aics/core';
import { Navigate, useNavigate } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { useAuthStore } from '~/features/auth/authStore';
import { useMySectionsQuery } from '~/features/section/queries';

import OnboardingRecovery from './OnboardingRecovery';
import { useTeamAssignmentProjectionQuery } from './queries';
import { resolvePreSurveySectionId } from './resolvePreSurveySectionId';
import { FirstMeeting, ResultAnnouncement, TeamSummary } from './result';
import ResultWaiting from './ResultWaiting';
import { SurveyForm } from './survey/SurveyForm';
import * as styles from './TeamAssignmentFlow.css';
type TeamAssignmentFlowProps = { teamOnly?: boolean };
export default function MockTeamAssignmentFlow({
  teamOnly,
}: TeamAssignmentFlowProps) {
  const clearSession = useAuthStore(state => state.clearSession);
  const navigate = useNavigate();
  const previewPhase = new URLSearchParams(window.location.search).get(
    'teamAssignmentPreview',
  );
  const developmentPreview = previewPhase as TeamAssignmentPhase | undefined;
  const currentSection = useAuthStore(state =>
    state.currentUser?.sections.find(section => section.role === 'STUDENT'),
  );
  const sectionId =
    currentSection?.id ?? (previewPhase ? 'oop-2026-2-01' : undefined);
  const query = useTeamAssignmentProjectionQuery(sectionId, developmentPreview);

  if (!sectionId) {
    return (
      <OnboardingRecovery
        description='로그인 정보가 오래되었거나, 아직 수강 분반이 연결되지 않았을 수 있어요.'
        onRelogin={() => {
          clearSession();
          void navigate({ to: ROUTES.LOGIN });
        }}
        title='수강 분반 정보를 확인하지 못했어요'
      />
    );
  }

  if (query.isPending) return <p>팀 온보딩 상태를 불러오는 중입니다.</p>;

  if (query.isError || !query.data) {
    return (
      <OnboardingRecovery
        description='사전 설문 제출 여부와 팀 배정 상태를 확인하지 못했어요.'
        onRelogin={() => {
          clearSession();
          void navigate({ to: ROUTES.LOGIN });
        }}
        onRetry={() => void query.refetch()}
        title='팀 온보딩 상태를 확인하지 못했어요'
      />
    );
  }

  if (teamOnly)
    return (
      <div className={styles.studentTeamPage}>
        <TeamSummary projection={query.data} />
      </div>
    );

  return (
    <PhaseContent currentSection={currentSection} projection={query.data} />
  );
}

function PhaseContent({
  currentSection,
  projection,
}: {
  currentSection: CurrentUserSection | undefined;
  projection: TeamAssignmentProjection;
}) {
  switch (projection.phase) {
    case 'survey':
      return (
        <SurveyPhase currentSection={currentSection} projection={projection} />
      );
    case 'resultWaiting':
      return (
        <ResultWaiting resultReleasesAt={projection.window.resultReleasesAt} />
      );
    case 'result':
      return <ResultAnnouncement projection={projection} />;
    case 'firstMeeting':
      return <FirstMeeting projection={projection} />;
    case 'completed':
      return <Navigate replace to={ROUTES.STUDENT.HOME} />;
  }
}

function SurveyPhase({
  currentSection,
  projection,
}: {
  currentSection: CurrentUserSection | undefined;
  projection: TeamAssignmentProjection;
}) {
  const clearSession = useAuthStore(state => state.clearSession);
  const navigate = useNavigate();
  const sectionsQuery = useMySectionsQuery({ status: 'ACTIVE' });
  const preSurveySectionId = resolvePreSurveySectionId(
    currentSection,
    sectionsQuery.data,
  );

  if (sectionsQuery.isPending) {
    return <p>설문 분반 정보를 확인하는 중입니다.</p>;
  }

  if (sectionsQuery.isError || !preSurveySectionId) {
    return (
      <OnboardingRecovery
        description='사전조사를 제출할 숫자 분반 ID를 확인하지 못했어요.'
        onRelogin={() => {
          clearSession();
          void navigate({ to: ROUTES.LOGIN });
        }}
        onRetry={() => void sectionsQuery.refetch()}
        title='설문 분반 정보를 확인하지 못했어요'
      />
    );
  }

  return (
    <SurveyForm
      preSurveySectionId={preSurveySectionId}
      projection={projection}
    />
  );
}
