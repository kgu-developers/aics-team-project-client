import { style } from '@vanilla-extract/css';

export const summary = style({
  alignItems: 'center',
  background: 'var(--color-background-muted)',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  justifyContent: 'space-between',
  padding: 'var(--spacing-4)',
});

export const actionCell = style({
  display: 'flex',
  justifyContent: 'flex-end',
});

export const imagePreviewGrid = style({
  display: 'grid',
  gap: 'var(--spacing-3)',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
});
