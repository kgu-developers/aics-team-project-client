import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  margin: '0 auto',
  maxWidth: 1160,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});

export const header = style({
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
  justifyContent: 'space-between',
});

export const filters = style({
  alignItems: 'flex-end',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
});

export const clickableRow = style({
  cursor: 'pointer',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: -2,
  },
});
