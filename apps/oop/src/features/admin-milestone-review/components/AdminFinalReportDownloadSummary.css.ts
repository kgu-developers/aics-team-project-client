import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const row = style({
  display: 'flex',
});

export const link = style({
  color: tokens.color.accent,
  textDecoration: 'underline',
  textUnderlineOffset: 2,
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});
