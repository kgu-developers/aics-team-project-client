import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[4],
});
export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: tokens.spacing[2],
});
