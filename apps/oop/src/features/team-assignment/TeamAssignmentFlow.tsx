import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

import LiveTeamAssignmentFlow from './LiveTeamAssignmentFlow';
import MockTeamAssignmentFlow from './MockTeamAssignmentFlow';

export default function TeamAssignmentFlow(props: { teamOnly?: boolean }) {
  if (props.teamOnly) return <LiveTeamAssignmentFlow {...props} />;

  return isMockDevelopmentMode(
    import.meta.env.DEV,
    import.meta.env.VITE_ENABLE_MSW,
  ) ? (
    <MockTeamAssignmentFlow />
  ) : (
    <LiveTeamAssignmentFlow {...props} />
  );
}
