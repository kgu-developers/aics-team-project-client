export type ErrorStateProps = {
  title: string;
  description?: string;
};

export function ErrorState({ title, description }: ErrorStateProps) {
  return (
    <section role='alert'>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </section>
  );
}
