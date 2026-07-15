import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/student/milestones')({
  component: StudentMilestonesPage,
});

function StudentMilestonesPage() {
  return (
    <PagePlaceholder
      title='학생 마일스톤 목록'
      description='학생이 제출해야 할 마일스톤 목록과 마감 상태를 확인하는 페이지입니다.'
      todos={['마일스톤 목록', '제출 가능 상태 표시', '산출물 제출 페이지 이동']}
    />
  );
}
