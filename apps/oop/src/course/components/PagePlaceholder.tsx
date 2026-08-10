import { Badge, Card, Heading, Text, VStack } from '@aics/design-system';

import * as styles from './PagePlaceholder.css';

type PagePlaceholderProps = {
  title: string;
  description: string;
  todos: string[];
};

export default function PagePlaceholder({
  title,
  description,
  todos,
}: PagePlaceholderProps) {
  return (
    <section className={styles.pagePlaceholder}>
      <VStack className={styles.content} gap={5}>
        <Badge
          className={styles.courseLabel}
          label='OOP Team Project'
          variant='info'
        />
        <Heading level={1}>{title}</Heading>
        <Text className={styles.lead} color='secondary' type='large'>
          {description}
        </Text>
        <Card className={styles.todoCard} aria-labelledby='todo-heading'>
          <Heading id='todo-heading' level={2}>
            이 페이지에서 이후 구현할 일
          </Heading>
          <ul>
            {todos.map(todo => (
              <li key={todo}>{todo}</li>
            ))}
          </ul>
        </Card>
      </VStack>
    </section>
  );
}
