import { Badge, Card, Heading, Text, VStack } from '@aics/design-system';

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
    <section className='page-placeholder'>
      <VStack className='page-placeholder__content' gap={5}>
        <Badge
          className='course-label'
          label='OOP Team Project'
          variant='info'
        />
        <Heading level={1}>{title}</Heading>
        <Text className='lead' color='secondary' type='large'>
          {description}
        </Text>
        <Card className='todo-card' aria-labelledby='todo-heading'>
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
