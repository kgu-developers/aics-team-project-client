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
  textDecoration: 'none',
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
  gap: 8,
  minWidth: 0,
});

export const title = style({
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
  fontSize: 13,
  flexShrink: 0,
  whiteSpace: 'nowrap',
});
