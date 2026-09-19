import { createLazyFileRoute } from '@tanstack/react-router';

import MidReportEditorPage from '~/features/mid-report/MidReportEditorPage';

export const Route = createLazyFileRoute('/student/editor/mid-review/$section')(
  {
    component: MidReviewEditorSectionRoute,
  },
);

function MidReviewEditorSectionRoute() {
  const { section } = Route.useParams();
  const { returnTo } = Route.useSearch();
  return <MidReportEditorPage returnTo={returnTo} section={section} />;
}
