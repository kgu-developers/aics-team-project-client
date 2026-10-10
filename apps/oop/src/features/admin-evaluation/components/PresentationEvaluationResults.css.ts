import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const content = style({
  display: 'grid',
  gap: 16,
  minWidth: 0,
  paddingBlockStart: 12,
});

export const toolbar = style({
  alignItems: 'end',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
});

export const emptyState = style({
  color: tokens.color.text.secondary,
  paddingBlock: 12,
  textAlign: 'center',
});

export const evaluatorButton = style({
  background: 'none',
  border: 0,
  color: tokens.color.text.accent,
  cursor: 'pointer',
  font: 'inherit',
  padding: 0,
  textAlign: 'left',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});
