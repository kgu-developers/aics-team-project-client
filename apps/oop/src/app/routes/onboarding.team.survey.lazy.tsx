import { createLazyFileRoute } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import OnboardingPhasePage from '~/course/components/OnboardingPhasePage';

export const Route = createLazyFileRoute('/onboarding/team/survey')({
  component: TeamSurveyPage,
});

function TeamSurveyPage() {
  return (
    <OnboardingPhasePage
      actionLabel='설문 제출하고 팀 결과 확인하기'
      actionTo={ROUTES.ONBOARDING.RESULT}
      description='팀 구성 설문을 작성하고 제출합니다. 역할·선호·관심 주제 같은 세부 입력 단계는 이 화면의 JSON 기반 form state로 관리합니다.'
      title='팀 구성 설문'
      todos={[
        '기간 전·중·마감 상태 표시',
        'JSON schema 기반 multi-step form',
        '임시 저장과 최종 제출',
      ]}
    />
  );
}
