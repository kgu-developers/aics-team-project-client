import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/student/submissions')({
  component: StudentSubmissionsPage,
});

function StudentSubmissionsPage() {
  return (
    <PagePlaceholder
      title='제출 버전 이력'
      description='학생이 본인 팀의 제출 버전과 검증 결과를 확인하는 페이지입니다.'
      todos={['제출 버전 목록', '검증 결과 요약', '제출 상세 이동']}
    />
  );
}
