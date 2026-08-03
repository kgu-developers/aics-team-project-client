import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/student/submissions')({
  component: StudentSubmissionsPage,
});

function StudentSubmissionsPage() {
  return (
    <PagePlaceholder
      title='제출물'
      description='마일스톤별 제출물과 제출 상태를 확인하고 작업으로 이동합니다.'
      todos={['제출물 목록', '초안·제출 완료 상태', '마일스톤별 제출 동선']}
    />
  );
}
