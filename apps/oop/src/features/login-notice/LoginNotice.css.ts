import { style } from '@vanilla-extract/css';

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  gap: 'var(--spacing-2)',
});
