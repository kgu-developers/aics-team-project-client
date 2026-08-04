import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/student/grades')({
  component: StudentGradesPage,
});

function StudentGradesPage() {
  return (
    <PagePlaceholder
      title='성적'
      description='확정된 성적과 평가 결과를 확인합니다.'
      todos={['최종 성적 표시', '루브릭 결과 확인', '관련 피드백 연결']}
    />
  );
}
