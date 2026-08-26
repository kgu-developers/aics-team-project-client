import { createLazyFileRoute } from '@tanstack/react-router';

import PresentationEvaluationPage from '~/features/evaluation/PresentationEvaluationPage';

export const Route = createLazyFileRoute('/student/presentation-evaluation')({
  component: PresentationEvaluationPage,
});
