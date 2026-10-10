import { Tab, TabList } from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

type AdminTeamActivityView = 'actions' | 'meetings';

type AdminTeamActivityTabsProps = {
  activeView: AdminTeamActivityView;
  sectionId?: string;
  teamId?: string;
};

export default function AdminTeamActivityTabs({
  activeView,
  sectionId,
  teamId,
}: AdminTeamActivityTabsProps) {
  const navigate = useNavigate();

  function selectView(view: string) {
    if (view !== 'actions' && view !== 'meetings') return;
    if (view === activeView) return;

    void navigate({
      search: {
        ...(sectionId ? { sectionId } : {}),
        ...(teamId ? { teamId } : {}),
      },
      to:
        view === 'meetings'
          ? ROUTES.ADMIN_MEETINGS
          : ROUTES.ADMIN_MEETING_ACTIONS,
    });
  }

  return (
    <TabList
      aria-label='팀 활동 보기'
      onChange={selectView}
      size='sm'
      value={activeView}
    >
      <Tab label='회의록' value='meetings' />
      <Tab label='액션플랜' value='actions' />
    </TabList>
  );
}
