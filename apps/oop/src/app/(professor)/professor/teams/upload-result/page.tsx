import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function ProfessorTeamsUploadResultPage() {
  return (
    <PagePlaceholder
      title='팀 업로드 결과'
      description='엑셀 업로드 결과와 오류를 확인하는 페이지입니다.'
      todos={['성공/실패 행 요약', '오류 행 다운로드 또는 수정 안내', '반영 확정 액션 연결']}
    />
  );
}
