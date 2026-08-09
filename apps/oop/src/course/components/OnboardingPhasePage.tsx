import { Button, Card, Heading, Text, VStack } from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';

import { type OnboardingDestination } from '~/app/constants/routes';

type OnboardingPhasePageProps = {
  title: string;
  description: string;
  todos: string[];
  actionLabel: string;
  actionTo: OnboardingDestination;
};

export default function OnboardingPhasePage({
  title,
  description,
  todos,
  actionLabel,
  actionTo,
}: OnboardingPhasePageProps) {
  const navigate = useNavigate();

  return (
    <section className='onboarding-phase-page'>
      <VStack gap={5}>
        <Heading level={1}>{title}</Heading>
        <Text color='secondary' type='large'>
          {description}
        </Text>
        <Card aria-labelledby='onboarding-todo-heading'>
          <Heading id='onboarding-todo-heading' level={2}>
            이 단계에서 이후 구현할 일
          </Heading>
          <ul>
            {todos.map(todo => (
              <li key={todo}>{todo}</li>
            ))}
          </ul>
        </Card>
        <Button
          label={actionLabel}
          onClick={() => navigate({ to: actionTo })}
          variant='primary'
        />
      </VStack>
    </section>
  );
}
