import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-4)',
});
export const header = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 'var(--spacing-2)',
});
export const title = style({
  margin: 0,
  color: tokens.color.text.primary,
  fontSize: tokens['font-size'].lg,
});
export const description = style({
  margin: 0,
  color: tokens.color.text.secondary,
});
export const candidateEnd = style({
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 'var(--spacing-2)',
});
export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-4)',
});
export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 'var(--spacing-3)',
});
export const error = style({ margin: 0, color: tokens.color.text.red });
