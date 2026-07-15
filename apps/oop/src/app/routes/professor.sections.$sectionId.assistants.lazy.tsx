import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/professor/sections/$sectionId/assistants')({
  component: ProfessorSectionsSectionIdAssistantsPage,
});

function ProfessorSectionsSectionIdAssistantsPage() {
  return (
    <PagePlaceholder
      title='조교 배정'
      description='특정 분반에 조교를 배정하고 담당 범위를 관리하는 페이지입니다.'
      todos={['조교 목록 표시', '분반 담당 조교 배정/해제', '변경 이력 기록']}
    />
  );
}
