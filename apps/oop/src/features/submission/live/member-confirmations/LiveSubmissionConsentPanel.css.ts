import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['3'],
  minWidth: 0,
  overflowWrap: 'anywhere',
});

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: tokens.spacing['2'],
});
