import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['6'],
  minWidth: 0,
});
export const card = style({ padding: tokens.spacing['6'] });
export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['3'],
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
});
