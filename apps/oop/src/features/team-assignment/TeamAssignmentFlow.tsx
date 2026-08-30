import type { TeamAssignmentPhase, TeamAssignmentProjection } from '@aics/core';
import { Button } from '@aics/design-system';
import { Navigate, useNavigate } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { useAuthStore } from '~/features/auth/authStore';

import { formatTeamAssignmentDate } from './formatTeamAssignmentDate';
import { useTeamAssignmentProjectionQuery } from './queries';
import { FirstMeeting, ResultAnnouncement, TeamSummary } from './result';
import { SurveyForm } from './survey/SurveyForm';
import { getTeamAssignmentDestination } from './teamAssignmentDestination';
import * as styles from './TeamAssignmentFlow.css';

type TeamAssignmentFlowProps = {
  allowed?: TeamAssignmentPhase[];
  resolveOnly?: boolean;
  teamOnly?: boolean;
};

export default function TeamAssignmentFlow({
  allowed,
  resolveOnly = false,
  teamOnly = false,
}: TeamAssignmentFlowProps) {
  const clearSession = useAuthStore(state => state.clearSession);
  const navigate = useNavigate();
  const previewPhase = import.meta.env.DEV
    ? new URLSearchParams(window.location.search).get('teamAssignmentPreview')
    : undefined;
  const developmentPreview = import.meta.env.DEV
    ? (previewPhase as TeamAssignmentPhase | undefined)
    : undefined;
  const sectionId = useAuthStore(
    state =>
      state.currentUser?.sections.find(section => section.role === 'STUDENT')
        ?.id ?? (previewPhase ? 'oop-2026-2-01' : undefined),
  );
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
    return <Navigate replace to={ROUTES.STUDENT.HOME} />;
  }

  if (
    resolveOnly ||
    (!teamOnly && allowed && !allowed.includes(query.data.phase))
  ) {
    return (
      <Navigate replace to={getTeamAssignmentDestination(query.data.phase)} />
    );
  }

  if (teamOnly)
    return (
      <div className={styles.studentTeamPage}>
        <TeamSummary projection={query.data} />
      </div>
    );

  return <PhaseContent projection={query.data} />;
}

function OnboardingRecovery({
  description,
  onRelogin,
  onRetry,
  title,
}: {
  description: string;
  onRelogin: () => void;
  onRetry?: () => void;
  title: string;
}) {
  return (
    <section
      className={styles.recoveryPage}
      aria-labelledby='onboarding-recovery-heading'
    >
      <div className={styles.recoveryContent}>
        <h1 id='onboarding-recovery-heading'>{title}</h1>
        <p>{description}</p>
        <p>수강 분반이 아직 연결되지 않았다면 담당 조교에게 문의해 주세요.</p>
      </div>
      <div className={`${styles.actions} ${styles.centeredActions}`}>
        {onRetry ? (
          <Button label='다시 확인' onClick={onRetry} variant='secondary' />
        ) : null}
        <Button label='다시 로그인' onClick={onRelogin} variant='primary' />
      </div>
    </section>
  );
}

function PhaseContent({
  projection,
}: {
  projection: TeamAssignmentProjection;
}) {
  switch (projection.phase) {
    case 'survey':
      return <SurveyForm projection={projection} />;
    case 'resultWaiting':
      return <ResultWaiting projection={projection} />;
    case 'result':
      return <ResultAnnouncement projection={projection} />;
    case 'firstMeeting':
      return <FirstMeeting projection={projection} />;
    case 'completed':
      return <Navigate replace to={ROUTES.STUDENT.HOME} />;
  }
}

function ResultWaiting({
  projection,
}: {
  projection: TeamAssignmentProjection;
}) {
  const navigate = useNavigate();

  return (
    <section
      className={styles.page}
      aria-labelledby='team-result-waiting-heading'
    >
      <div className={styles.waitingContent}>
        <img
          alt='설문 제출 완료'
          className={styles.illustration}
          src='/team-survey-illustration.svg'
        />
        <h1 className={styles.headline} id='team-result-waiting-heading'>
          설문에 응답해 주셔서 감사합니다.
        </h1>
        <p>
          팀 선정 결과는{' '}
          {formatTeamAssignmentDate(projection.window.resultReleasesAt)}에
          공개됩니다.
        </p>
      </div>
      {import.meta.env.DEV ? (
        <div className={`${styles.actions} ${styles.centeredActions}`}>
          <Button
            label='개발용: 팀 선정 결과 보기'
            onClick={() =>
              void navigate({
                search: { teamAssignmentPreview: 'result' },
                to: ROUTES.ONBOARDING.RESULT,
              })
            }
            variant='secondary'
          />
        </div>
      ) : null}
    </section>
  );
}
