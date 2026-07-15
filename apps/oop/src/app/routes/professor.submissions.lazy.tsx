import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/professor/submissions')({
  component: ProfessorSubmissionsPage,
});

function ProfessorSubmissionsPage() {
  return (
    <PagePlaceholder
      title='제출물 검토'
      description='제출물 목록을 필터링하고 검토 대상을 찾는 페이지입니다.'
      todos={['분반/팀/마일스톤 필터', '제출 상태 표시', '제출 상세로 이동']}
    />
  );
}
