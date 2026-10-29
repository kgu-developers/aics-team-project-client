import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const header = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing[3],
  justifyContent: 'space-between',
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
