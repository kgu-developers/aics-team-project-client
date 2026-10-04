import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const teamList = style({
  borderTop: `1px solid ${tokens.color.border.base}`,
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

export const teamLink = style({
  alignItems: 'center',
  borderBottom: `1px solid ${tokens.color.border.base}`,
  color: tokens.color.text.primary,
  display: 'flex',
  fontSize: 14,
  fontWeight: 500,
  gap: 16,
  justifyContent: 'space-between',
  padding: '12px 4px',
  textDecoration: 'none',
  width: '100%',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
  ':hover': {
    color: tokens.color.text.accent,
  },
  '@media': {
    'screen and (max-width: 640px)': {
      alignItems: 'flex-start',
      flexDirection: 'column',
      gap: 4,
    },
  },
});

export const teamLinkAction = style({
  color: tokens.color.text.accent,
  flexShrink: 0,
  fontSize: 13,
  fontWeight: 500,
});
