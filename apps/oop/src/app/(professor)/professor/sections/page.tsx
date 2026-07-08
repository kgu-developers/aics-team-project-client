import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function ProfessorSectionsPage() {
  return (
    <PagePlaceholder
      title='분반 관리'
      description='OOP 앱의 핵심 운영 축인 분반 목록과 상태를 관리하는 페이지입니다.'
      todos={['분반 목록 표시', '분반 생성/수정 액션 연결', '분반별 조교/팀/마일스톤 현황 요약']}
    />
  );
}
