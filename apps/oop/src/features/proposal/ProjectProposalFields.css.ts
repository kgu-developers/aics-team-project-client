import { style } from '@vanilla-extract/css';
export const item = style({
  display: 'grid',
  gap: 'var(--spacing-4)',
  padding: 'var(--spacing-4)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
});
export const image = style({
  maxWidth: '100%',
  maxHeight: '360px',
  objectFit: 'contain',
});
