import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const cell = style({
  display: 'grid',
  gap: tokens.spacing[1],
  minWidth: 0,
});

export const actionContent = style({
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const meetingLink = style({
  color: tokens.color.text.accent,
  display: 'block',
  overflow: 'hidden',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  width: '100%',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});

export const secondaryText = style({
  color: tokens.color.text.secondary,
  overflow: 'hidden',
  fontSize: 'var(--font-size-sm)',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const emptyCell = style({
  color: tokens.color.text.secondary,
  display: 'block',
  padding: `${tokens.spacing[8]} ${tokens.spacing[4]}`,
  textAlign: 'center',
});
