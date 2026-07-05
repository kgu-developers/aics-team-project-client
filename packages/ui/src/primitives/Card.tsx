import type { ReactNode } from 'react';

export type CardProps = {
  children: ReactNode;
  title?: string;
};

export function Card({ children, title }: CardProps) {
  return (
    <section>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  );
}
