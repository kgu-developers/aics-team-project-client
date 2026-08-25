import { style } from '@vanilla-extract/css';

export const row = style({
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  display: 'grid',
  gap: 'var(--spacing-4)',
  padding: 'var(--spacing-4)',
});
