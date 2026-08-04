import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/student/')({
  component: StudentDashboardPage,
});

function StudentDashboardPage() {
  return (
    <PagePlaceholder
      title='내 프로젝트'
      description='팀의 현재 진행 상태와 지금 해야 할 일을 한눈에 확인합니다.'
      todos={[
        '마감 임박 마일스톤 요약',
        '다음 작업으로 이동하는 상태 기반 CTA',
        '팀원 진행 현황과 최신 피드백 요약',
      ]}
    />
  );
}
