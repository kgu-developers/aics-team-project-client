import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function ProfessorRubricsRubricIdPage() {
  return (
    <PagePlaceholder
      title='루브릭 상세'
      description='루브릭 수정과 마일스톤 연결을 관리하는 페이지입니다.'
      todos={['항목별 점수 기준 수정', '마일스톤 연결/해제', '사용 중인 제출 평가 영향 확인']}
    />
  );
}
