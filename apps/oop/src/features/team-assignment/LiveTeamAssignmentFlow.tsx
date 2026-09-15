import { Button } from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';
import { isAxiosError } from 'axios';

import { ROUTES } from '~/app/constants/routes';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';
import StudentContextState from '~/features/section/StudentContextState';
import { useStudentContext } from '~/features/section/useStudentContext';

import AssignedTeamFlow from './AssignedTeamFlow';
import * as styles from './LiveTeamAssignmentFlow.css';
import OnboardingRecovery from './OnboardingRecovery';
import { useMyTeamAssignmentSurveyQuery } from './queries';
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
  const surveyQuery = useMyTeamAssignmentSurveyQuery(
    authenticated && context.status === 'no-team' ? section?.id : undefined,
  );
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
      ) : surveyQuery.isError ? (
        isAxiosError(surveyQuery.error) &&
        surveyQuery.error.response?.status === 404 ? (
          <SurveyForm key={section.id} preSurveySectionId={section.id} />
        ) : (
          recovery(
            '사전 설문 제출 상태를 확인하지 못했어요.',
            () => void surveyQuery.refetch(),
          )
        )
      ) : (
        <ResultWaiting />
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
