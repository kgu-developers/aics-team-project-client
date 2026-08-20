import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const formActions = style({
  display: 'flex',
  gap: 12,
  justifyContent: 'flex-end',
});

export const formTitle = style({
  color: tokens.color.text.primary,
  fontSize: 16,
  fontWeight: 600,
  margin: 0,
});

export const error = style({
  color: tokens.color.text.red,
  margin: 0,
});
