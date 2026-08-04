import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/student/peer-review')({
  component: StudentPeerReviewPage,
});

function StudentPeerReviewPage() {
  return (
    <PagePlaceholder
      title='상호평가'
      description='평가 기간에 팀원 기여도를 작성하고 제출 상태를 확인합니다.'
      todos={['평가 가능 기간 안내', '팀원 기여도 입력', '제출 완료 상태']}
    />
  );
}
