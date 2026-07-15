import { createLazyFileRoute } from '@tanstack/react-router';

import PagePlaceholder from '~/course/components/PagePlaceholder';

export const Route = createLazyFileRoute('/professor/teams/upload')({
  component: ProfessorTeamsUploadPage,
});

function ProfessorTeamsUploadPage() {
  return (
    <PagePlaceholder
      title='팀 엑셀 업로드'
      description='팀 편성 데이터를 엑셀로 업로드하는 페이지입니다.'
      todos={['업로드 양식 안내', '파일 선택과 사전 검증', '업로드 결과 확인 페이지 연결']}
    />
  );
}
