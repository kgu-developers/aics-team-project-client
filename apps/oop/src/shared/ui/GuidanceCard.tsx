import { Card, Text, VStack } from '@aics/design-system';
import type { ReactNode } from 'react';

type GuidanceCardProps = {
  children: ReactNode;
  title: string;
};

export function GuidanceCard({ children, title }: GuidanceCardProps) {
  return (
    <Card padding={3} variant='muted'>
      <VStack gap={1}>
        <Text weight='medium'>{title}</Text>
        {children}
      </VStack>
    </Card>
  );
}
