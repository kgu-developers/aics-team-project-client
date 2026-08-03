import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/student/project-topic')({
  component: StudentProjectTopicPage,
});

function StudentProjectTopicPage() {
  return (
    <PagePlaceholder
      title='프로젝트 주제'
      description='팀이 선택한 프로젝트 주제와 관련 진행 상태를 확인합니다.'
      todos={['선정 상태 표시', '주제 상세 표시', '팀 페이지와 연결']}
    />
  );
}
