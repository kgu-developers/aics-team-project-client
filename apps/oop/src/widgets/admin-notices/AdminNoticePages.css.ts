import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  margin: '0 auto',
  maxWidth: 1240,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});
export const titleRow = style({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'space-between',
});
export const backLink = style({
  color: tokens.color.text.accent,
  fontSize: 13,
  textDecoration: 'none',
});
export const tableCard = style({ overflowX: 'auto', padding: 0 });
export const table = style({
  borderCollapse: 'collapse',
  minWidth: 660,
  width: '100%',
});
export const titleLink = style({
  color: tokens.color.text.primary,
  textDecoration: 'none',
  ':hover': {
    color: tokens.color.text.accent,
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  },
});
export const emptyCell = style({
  color: tokens.color.text.secondary,
  padding: '42px 16px !important',
  textAlign: 'center',
});
export const listFooter = style({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'space-between',
});
export const detailCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 28,
});
export const formCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  maxWidth: 760,
  padding: 28,
});
export const meta = style({ fontSize: 13 });
export const divider = style({
  background: tokens.color.border.base,
  height: 1,
  width: '100%',
});
export const actions = style({
  display: 'flex',
  gap: 8,
  justifyContent: 'flex-end',
  marginTop: 8,
});
export const fields = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
});
globalStyle(table + ' th', {
  background: tokens.color.background.card,
  color: tokens.color.text.secondary,
  fontSize: 13,
  fontWeight: 500,
  padding: '12px 16px',
  textAlign: 'left',
});
globalStyle(table + ' td', {
  borderTop: '1px solid ' + tokens.color.border.base,
  fontSize: 14,
  padding: '14px 16px',
});

globalStyle(table + ' tbody tr:hover td', {
  background: tokens.color.background.muted,
});
