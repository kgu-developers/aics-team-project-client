import { TeamDashboardTemplate } from '@aics/team-project-kit';

import { oopCourseConfig } from '~/course/config';
import { oopTeams } from '~/course/teams';

export default function HomePage() {
  return <TeamDashboardTemplate course={oopCourseConfig} teams={oopTeams} />;
}
