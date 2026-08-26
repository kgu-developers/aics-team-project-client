import { createLazyFileRoute } from '@tanstack/react-router';

import PeerEvaluationPage from '~/features/evaluation/PeerEvaluationPage';

export const Route = createLazyFileRoute('/student/peer-review')({
  component: PeerEvaluationPage,
});
