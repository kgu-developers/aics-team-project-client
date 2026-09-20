import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const dot = style({
  background: tokens.color.text.accent,
  borderRadius: tokens.radius.full,
  display: 'inline-block',
  flexShrink: 0,
  height: 7,
  marginRight: 8,
  verticalAlign: 'middle',
  width: 7,
});
