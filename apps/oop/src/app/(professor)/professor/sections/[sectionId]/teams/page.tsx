import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function ProfessorSectionsSectionIdTeamsPage() {
  return (
    <PagePlaceholder
      title='분반별 팀 목록'
      description='특정 분반에 속한 팀 목록을 확인하는 페이지입니다.'
      todos={['분반 기준 팀 목록 표시', '팀 상세로 이동', '미배정/리스크 팀 필터 제공']}
    />
  );
}
