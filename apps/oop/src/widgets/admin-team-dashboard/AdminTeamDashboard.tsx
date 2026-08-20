import { Heading, Text } from '@aics/design-system';
import { useParams } from '@tanstack/react-router';

import { useAdminTeamDashboardQuery } from '~/features/admin-team-dashboard/queries';

import * as styles from './AdminTeamDashboard.css';

export default function AdminTeamDashboard() {
  const { teamId } = useParams({ from: '/admin/teams/$teamId' });
  const teamDashboardQuery = useAdminTeamDashboardQuery(teamId);

  if (teamDashboardQuery.isPending) {
    return (
      <div className={styles.page}>
        <Text>팀 정보를 불러오는 중입니다.</Text>
      </div>
    );
  }

  if (teamDashboardQuery.isError) {
    return (
      <div className={styles.page}>
        <Text>팀 정보를 불러오지 못했습니다.</Text>
      </div>
    );
  }

  const team = teamDashboardQuery.data;

  return (
    <div className={styles.page}>
      <Heading level={1}>
        {team.section.code}반 - {team.name} 대시보드
      </Heading>

      <section>
        <Heading level={2}>팀 기본 정보</Heading>
        <Text>프로젝트 주제: {team.projectTopic ?? '미정'}</Text>

        <ul>
          {team.members.map(member => (
            <li key={member.id}>
              <Text>
                {member.name} / {member.studentNumber} / {member.major} /{' '}
                {member.isLeader ? '팀장' : '팀원'} /{' '}
                {member.projectRole ?? '역할 미정'}
              </Text>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
