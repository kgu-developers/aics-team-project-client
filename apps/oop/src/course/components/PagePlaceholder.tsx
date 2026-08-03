import {
  Badge,
  Button,
  Card,
  Heading,
  Text,
  VStack,
} from '@aics/design-system';

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
    <main>
      <VStack className='page-shell' gap={5}>
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
          <Button label='일 추가' variant='primary' />
        </Card>
      </VStack>
    </main>
  );
}
