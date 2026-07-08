import PagePlaceholder from '~/course/components/PagePlaceholder';

export default function StudentTeamPage() {
  return (
    <PagePlaceholder
      title='내 팀 정보'
      description='학생이 본인의 팀 배정, 팀원, 역할을 확인하는 페이지입니다.'
      todos={['팀 배정 확인', '팀원과 역할 표시', '팀 프로젝트 주제 상태 연결']}
    />
  );
}
