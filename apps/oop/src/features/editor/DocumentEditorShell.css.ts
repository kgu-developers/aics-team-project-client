import { style } from '@vanilla-extract/css';

export const notice = style({
  alignItems: 'center',
  background: 'var(--color-background-muted)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--color-text-secondary)',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-3)',
  justifyContent: 'space-between',
  padding: 'var(--spacing-3) var(--spacing-4)',
});
export const actionBar = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--spacing-3)',
});
export const actionError = style({
  color: 'var(--color-text-critical, var(--color-text-primary))',
  width: '100%',
});
