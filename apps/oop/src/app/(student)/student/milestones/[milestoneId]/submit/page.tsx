import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function StudentMilestonesMilestoneIdSubmitPage() {
  return (
    <PagePlaceholder
      title='산출물 제출'
      description='파일이나 링크 형태로 팀 산출물을 제출하는 페이지입니다.'
      todos={['파일/링크 제출', '제출 검증 결과 표시', '재제출 가능 여부 안내']}
    />
  );
}
