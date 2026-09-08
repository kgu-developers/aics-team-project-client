import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['4'],
});
export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing['2'],
});
