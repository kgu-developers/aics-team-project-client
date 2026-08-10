import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
});

export const status = style({
  color: tokens.color.text.secondary,
  fontSize: 14,
  margin: 0,
  padding: '32px 0',
  textAlign: 'center',
});
