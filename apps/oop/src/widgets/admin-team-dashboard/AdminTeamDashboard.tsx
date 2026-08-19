import { Heading, Text } from '@aics/design-system';
import { useParams } from '@tanstack/react-router';

import * as styles from './AdminTeamDashboard.css';

export default function AdminTeamDashboard() {
  const { teamId } = useParams({ from: '/admin/teams/$teamId' });

  return (
    <div className={styles.page}>
      <Heading level={1}>팀 대시보드</Heading>
      <Text color='secondary'>선택한 팀 ID: {teamId}</Text>
    </div>
  );
}
