import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const unreadDot = style({
  backgroundColor: tokens.color.accent,
  borderRadius: '50%',
  display: 'inline-block',
  flexShrink: 0,
  height: 6,
  marginInlineEnd: 6,
  verticalAlign: 'middle',
  width: 6,
});
