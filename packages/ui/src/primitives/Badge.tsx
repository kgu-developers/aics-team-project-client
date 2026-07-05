import type { ReactNode } from 'react';

export type BadgeProps = {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
};

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  return <span data-tone={tone}>{children}</span>;
}
