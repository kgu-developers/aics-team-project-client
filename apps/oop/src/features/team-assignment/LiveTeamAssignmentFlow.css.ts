import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const flow = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: tokens.spacing['6'],
  minHeight: 0,
  width: '100%',
});
