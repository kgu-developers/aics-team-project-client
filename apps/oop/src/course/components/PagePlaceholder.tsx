type PagePlaceholderProps = {
  title: string;
  description: string;
  todos: string[];
};

export default function PagePlaceholder({ title, description, todos }: PagePlaceholderProps) {
  return (
    <main className='page-shell'>
      <p className='eyebrow'>OOP Team Project</p>
      <h1>{title}</h1>
      <p className='lead'>{description}</p>
      <section className='todo-card' aria-labelledby='todo-heading'>
        <h2 id='todo-heading'>이 페이지에서 이후 구현할 일</h2>
        <ul>
          {todos.map((todo) => (
            <li key={todo}>{todo}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
