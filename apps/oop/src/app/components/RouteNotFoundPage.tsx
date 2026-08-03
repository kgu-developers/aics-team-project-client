import { Button, Heading, Text, VStack } from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';

type RouteNotFoundPageProps = {
  title: string;
  description: string;
  actionLabel: string;
  actionTo: '/student' | '/onboarding/team';
};

export default function RouteNotFoundPage({
  title,
  description,
  actionLabel,
  actionTo,
}: RouteNotFoundPageProps) {
  const navigate = useNavigate();

  return (
    <section className='not-found-page'>
      <VStack gap={4}>
        <Heading level={1}>{title}</Heading>
        <Text color='secondary' type='large'>
          {description}
        </Text>
        <Button
          label={actionLabel}
          onClick={() => navigate({ to: actionTo })}
          variant='primary'
        />
      </VStack>
    </section>
  );
}
