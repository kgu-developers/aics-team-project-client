import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/professor/sections/$sectionId')({
  component: ProfessorSectionsSectionIdPage,
});

function ProfessorSectionsSectionIdPage() {
  return (
    <PagePlaceholder
      title='분반 상세'
      description='특정 분반의 팀, 조교, 제출 현황을 확인하는 페이지입니다.'
      todos={['분반 기본 정보 표시', '분반 소속 팀 목록 요약', '담당 조교와 리스크 팀 현황 연결']}
    />
  );
}
