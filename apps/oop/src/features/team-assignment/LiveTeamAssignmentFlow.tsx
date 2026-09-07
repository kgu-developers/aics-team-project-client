import { Button } from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';
import { isAxiosError } from 'axios';

import { ROUTES } from '~/app/constants/routes';

import { useAuthStore } from '~/features/auth/authStore';
import { useCurrentUserQuery } from '~/features/auth/queries';
import { useMySectionsQuery } from '~/features/section/queries';
import SectionSelection from '~/features/section/SectionSelection';
import { useSelectedSection } from '~/features/section/useSelectedSection';

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
  const storedUser = useAuthStore(state => state.currentUser);
  const clearSession = useAuthStore(state => state.clearSession);
  const navigate = useNavigate();
  const userQuery = useCurrentUserQuery();
  const sectionsQuery = useMySectionsQuery({ status: 'ACTIVE' });
  const { section, selectSection } = useSelectedSection(sectionsQuery.data);
  const user = userQuery.data ?? storedUser;
  const teamId = user?.teamId;
  const surveyQuery = useMyTeamAssignmentSurveyQuery(
    !user ||
      userQuery.isPending ||
      userQuery.isError ||
      sectionsQuery.isPending ||
      sectionsQuery.isError ||
      teamId
      ? undefined
      : section?.id,
  );
  const recovery = (description: string, retry: () => void) => (
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

  if (userQuery.isPending && userQuery.isFetching)
    return <p>로그인 정보를 확인하는 중입니다.</p>;
  if (userQuery.isError || !user)
    return recovery(
      '로그인 정보를 확인해 주세요.',
      () => void userQuery.refetch(),
    );
  if (sectionsQuery.isPending) return <p>수강 분반을 확인하는 중입니다.</p>;
  if (sectionsQuery.isError)
    return recovery(
      '수강 분반을 불러오지 못했어요.',
      () => void sectionsQuery.refetch(),
    );
  if (!sectionsQuery.data?.length)
    return recovery(
      '연결된 수강 분반이 없어요.',
      () => void sectionsQuery.refetch(),
    );
  if (
    teamId &&
    (user.sections.length !== 1 || String(section?.id) !== user.sections[0]?.id)
  ) {
    return recovery(
      '배정된 팀이 어느 수강 분반에 속하는지 확인할 수 없어요. 담당 조교에게 문의해 주세요.',
      () => void userQuery.refetch(),
    );
  }

  return (
    <section className={styles.flow}>
      <SectionSelection
        sections={sectionsQuery.data}
        selectedId={section?.id}
        onSelect={selectSection}
      />
      {!section ? (
        <p>설문에 응답할 수강 분반을 선택해 주세요.</p>
      ) : teamId ? (
        <p>
          팀 배정이 확인됐어요. 배정 결과와 첫 만남 절차는 연결 준비 중입니다.
        </p>
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
