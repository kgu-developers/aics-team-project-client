import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  marginTop: tokens.spacing['3'],
  overflowWrap: 'anywhere',
});
export const summary = style({
  cursor: 'pointer',
  color: tokens.color.text.secondary,
});
export const content = style({ paddingTop: tokens.spacing['3'] });
