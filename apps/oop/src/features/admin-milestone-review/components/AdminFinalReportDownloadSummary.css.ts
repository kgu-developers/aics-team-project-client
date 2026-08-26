import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const row = style({
  alignItems: 'center',
  display: 'flex',
  gap: 12,
  justifyContent: 'space-between',
});

export const link = style({
  background: tokens.color.accent,
  borderRadius: 8,
  color: tokens.color['on-accent'],
  flex: 'none',
  fontSize: 14,
  padding: '8px 12px',
  textDecoration: 'none',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});
