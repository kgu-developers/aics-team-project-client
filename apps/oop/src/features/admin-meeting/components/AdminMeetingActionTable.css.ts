import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const cell = style({
  display: 'grid',
  gap: tokens.spacing[1],
  minWidth: 0,
});

export const actionContent = style({
  overflowWrap: 'anywhere',
});

export const meetingLink = style({
  color: tokens.color.text.accent,
  overflowWrap: 'anywhere',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  width: 'fit-content',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});

export const secondaryText = style({
  color: tokens.color.text.secondary,
  fontSize: 'var(--font-size-sm)',
  overflowWrap: 'anywhere',
});

export const emptyCell = style({
  color: tokens.color.text.secondary,
  display: 'block',
  padding: `${tokens.spacing[8]} ${tokens.spacing[4]}`,
  textAlign: 'center',
});
