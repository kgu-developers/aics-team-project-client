import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function ProfessorProjectTopicsPage() {
  return (
    <PagePlaceholder
      title='프로젝트 주제 승인'
      description='학생 또는 팀장이 등록한 프로젝트 주제를 검토하고 승인하는 페이지입니다.'
      todos={['주제 목록과 상태 필터', '승인/반려/수정 요청', '팀 상세로 이동']}
    />
  );
}
