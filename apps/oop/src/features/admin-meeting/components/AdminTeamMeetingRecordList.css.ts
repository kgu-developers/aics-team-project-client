import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const header = style({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'space-between',
});

export const allLink = style({
  color: tokens.color.text.accent,
  fontSize: 13,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

export const record = style({
  alignItems: 'center',
  color: tokens.color.text.primary,
  display: 'flex',
  gap: 16,
  justifyContent: 'space-between',
  minHeight: 44,
  minWidth: 0,
  padding: '10px 14px',
  textDecoration: 'none',
  ':hover': {
    background: tokens.color.background.muted,
  },
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: -2,
  },
});

export const recordMain = style({
  alignItems: 'center',
  display: 'flex',
  flex: '1 1 auto',
  gap: 8,
  minWidth: 0,
});

export const title = style({
  flex: '1 1 0',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

globalStyle(`${record} + ${record}`, {
  borderTop: `1px solid ${tokens.color.border.base}`,
});

export const date = style({
  color: tokens.color.text.secondary,
  flexShrink: 0,
  fontSize: 13,
});

export const team = style({
  color: tokens.color.text.secondary,
  flex: '0 1 220px',
  fontSize: 13,
  maxWidth: '40%',
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
