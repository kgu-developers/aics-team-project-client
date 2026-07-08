import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function ProfessorSubmissionsSubmissionIdPage() {
  return (
    <PagePlaceholder
      title='제출물 상세 검토'
      description='제출물 내용을 열람하고 피드백, 내부 메모, 루브릭 평가를 입력하는 페이지입니다.'
      todos={['공개 피드백 작성', '내부 메모 작성', '수정 요청과 CheerPJ Java 실행 연결', '항목별 루브릭 점수 입력']}
    />
  );
}
