import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const header = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const milestoneLink = style({
  color: tokens.color.text.accent,
  fontWeight: 600,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  selectors: {
    '&:focus-visible': {
      outline: `2px solid ${tokens.color.accent}`,
      outlineOffset: 2,
    },
  },
});
