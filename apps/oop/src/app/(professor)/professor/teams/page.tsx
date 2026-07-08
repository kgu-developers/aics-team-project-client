import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function ProfessorTeamsPage() {
  return (
    <PagePlaceholder
      title='팀 관리'
      description='전체 팀 목록과 팀 구성 상태를 관리하는 페이지입니다.'
      todos={['팀 목록/검색/필터', '엑셀 업로드 진입', '팀 상세와 프로젝트 주제 승인 연결']}
    />
  );
}
