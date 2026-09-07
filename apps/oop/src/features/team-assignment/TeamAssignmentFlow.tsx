import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

import LiveTeamAssignmentFlow from './LiveTeamAssignmentFlow';
import MockTeamAssignmentFlow from './MockTeamAssignmentFlow';

export default function TeamAssignmentFlow(props: { teamOnly?: boolean }) {
  return isMockDevelopmentMode(
    import.meta.env.DEV,
    import.meta.env.VITE_ENABLE_MSW,
  ) ? (
    <MockTeamAssignmentFlow {...props} />
  ) : (
    <LiveTeamAssignmentFlow {...props} />
  );
}
