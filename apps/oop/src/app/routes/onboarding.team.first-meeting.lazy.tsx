import { createLazyFileRoute } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import OnboardingPhasePage from '~/course/components/OnboardingPhasePage';

export const Route = createLazyFileRoute('/onboarding/team/first-meeting')({
  component: FirstMeetingPage,
});

function FirstMeetingPage() {
  return (
    <OnboardingPhasePage
      actionLabel='학생 프로젝트 홈으로 가기'
      actionTo={ROUTES.STUDENT.HOME}
      description='첫 대면에서 팀의 시작 약속을 정리하고 프로젝트 운영 화면으로 진입합니다.'
      title='첫 대면 준비'
      todos={[
        '첫 대면 일정과 장소 안내',
        '팀장·연락 방식·기본 약속 확인',
        '온보딩 완료 처리 후 학생 홈 진입',
      ]}
    />
  );
}
