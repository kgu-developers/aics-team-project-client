import type { Course, Team } from '@aics/core';
import { Card, EmptyState } from '@aics/ui';

export type TeamDashboardTemplateProps = {
  course: Course;
  teams: Team[];
};

export function TeamDashboardTemplate({
  course,
  teams,
}: TeamDashboardTemplateProps) {
  return (
    <main>
      <h1>{course.title}</h1>
      <p>{course.semester} 팀 프로젝트 현황</p>
      {teams.length === 0 ? (
        <EmptyState
          title='아직 등록된 팀이 없습니다.'
          description='분반과 팀 구성이 확정되면 이곳에 표시됩니다.'
        />
      ) : (
        <section aria-label='팀 목록'>
          {teams.map(team => (
            <Card key={team.id} title={team.name}>
              <p>{team.members.length}명</p>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}
