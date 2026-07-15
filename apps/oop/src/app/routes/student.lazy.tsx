import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/student')({
  component: StudentPage,
});

function StudentPage() {
  return (
    <PagePlaceholder
      title='학생 대시보드'
      description='학생이 본인 팀, 마일스톤, 제출, 피드백을 확인하는 홈입니다.'
      todos={['내 팀과 역할 표시', '마감 임박 마일스톤 요약', '피드백/성적 확인 연결']}
    />
  );
}
