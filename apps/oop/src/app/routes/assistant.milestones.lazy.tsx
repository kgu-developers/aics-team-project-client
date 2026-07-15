import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/assistant/milestones')({
  component: AssistantMilestonesPage,
});

function AssistantMilestonesPage() {
  return (
    <PagePlaceholder
      title='조교 마일스톤 확인'
      description='조교가 검토해야 할 마일스톤 일정과 제출 상태를 확인하는 페이지입니다.'
      todos={['마일스톤 목록', '마감 임박 상태', '제출 검토 화면 연결']}
    />
  );
}
