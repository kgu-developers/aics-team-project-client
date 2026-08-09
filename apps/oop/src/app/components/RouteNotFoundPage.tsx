import { Button, Heading, Text, VStack } from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';

import { type RouteDestination } from '~/app/constants/routes';

import { notFoundPage } from './NotFoundPage.css';

type RouteNotFoundPageProps = {
  title: string;
  description: string;
  actionLabel: string;
  actionTo: RouteDestination;
};

export default function RouteNotFoundPage({
  title,
  description,
  actionLabel,
  actionTo,
}: RouteNotFoundPageProps) {
  const navigate = useNavigate();

  return (
    <section className={notFoundPage}>
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
