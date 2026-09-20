import { style } from '@vanilla-extract/css';

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 24,
});

export const fieldRow = style({
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
});
