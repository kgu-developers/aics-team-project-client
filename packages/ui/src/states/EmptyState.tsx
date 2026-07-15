export type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section aria-live='polite'>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </section>
  );
}
