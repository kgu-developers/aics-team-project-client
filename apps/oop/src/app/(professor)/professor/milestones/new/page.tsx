import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function ProfessorMilestonesNewPage() {
  return (
    <PagePlaceholder
      title='마일스톤 생성'
      description='새 마일스톤의 일정, 제출 요건, 공개 여부를 설정하는 페이지입니다.'
      todos={['기본 정보 입력', '제출 항목 정의', '루브릭 연결 준비']}
    />
  );
}
