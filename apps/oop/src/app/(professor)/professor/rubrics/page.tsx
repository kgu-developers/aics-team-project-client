import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function ProfessorRubricsPage() {
  return (
    <PagePlaceholder
      title='루브릭 관리'
      description='평가 루브릭 목록과 마일스톤 연결 상태를 관리하는 페이지입니다.'
      todos={['루브릭 목록 표시', '루브릭 생성', '마일스톤 연결 상태 요약']}
    />
  );
}
