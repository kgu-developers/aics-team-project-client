import { createLazyFileRoute } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import OnboardingPhasePage from '~/course/components/OnboardingPhasePage';

export const Route = createLazyFileRoute('/onboarding/team/result')({
  component: TeamResultPage,
});

function TeamResultPage() {
  return (
    <OnboardingPhasePage
      actionLabel='첫 대면 준비하기'
      actionTo={ROUTES.ONBOARDING.FIRST_MEETING}
      description='팀 배정 결과와 팀원을 확인하고, 첫 대면 전에 필요한 안내를 확인합니다.'
      title='팀 배정 결과'
      todos={[
        '결과 공개 전 대기 상태',
        '배정된 팀과 팀원 표시',
        '첫 대면 일정과 준비 사항 안내',
      ]}
    />
  );
}
