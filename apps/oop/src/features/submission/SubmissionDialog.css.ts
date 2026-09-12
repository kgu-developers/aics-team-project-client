import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const content = style({
  boxSizing: 'border-box',
  maxHeight: 'calc(100dvh - 48px)',
  minWidth: 0,
  overflowY: 'auto',
  overscrollBehavior: 'contain',
  overflowWrap: 'anywhere',
  padding: tokens.spacing['4'],
});
