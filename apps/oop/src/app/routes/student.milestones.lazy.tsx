import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/student/milestones')({
  component: StudentMilestonesPage,
});

function StudentMilestonesPage() {
  return (
    <PagePlaceholder
      title='마일스톤'
      description='프로젝트 단계별 기간, 진행 상태, 다음 작업을 확인합니다.'
      todos={[
        '기간 전·중·마감 상태 표시',
        '제출 가능 상태 표시',
        '다음 작업 CTA',
      ]}
    />
  );
}
