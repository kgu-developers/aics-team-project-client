import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['4'],
});
export const summary = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
  overflowWrap: 'anywhere',
});
export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing['2'],
});
