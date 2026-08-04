import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/student/feedback')({
  component: StudentFeedbackPage,
});

function StudentFeedbackPage() {
  return (
    <PagePlaceholder
      title='피드백'
      description='교수자와 조교의 피드백, 수정 요청, 재제출 상태를 확인합니다.'
      todos={['피드백 목록', '수정 요청 상태', '재제출 동선']}
    />
  );
}
