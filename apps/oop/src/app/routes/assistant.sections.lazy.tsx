import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/assistant/sections')({
  component: AssistantSectionsPage,
});

function AssistantSectionsPage() {
  return (
    <PagePlaceholder
      title='담당 분반 현황'
      description='조교가 담당하는 분반 목록과 운영 상태를 확인하는 페이지입니다.'
      todos={['담당 분반 목록', '분반별 팀/제출 요약', '리스크 팀 확인']}
    />
  );
}
