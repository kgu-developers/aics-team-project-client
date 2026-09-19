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
export const tableCard = style({ overflowX: 'auto', padding: 0 });
export const table = style({
  borderCollapse: 'collapse',
  minWidth: 760,
  width: '100%',
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
  verticalAlign: 'top',
});
globalStyle(table + ' tbody tr:hover td', {
  background: tokens.color.background.muted,
});
export const messageRow = style({ cursor: 'pointer' });
globalStyle(`${table} tbody tr:focus-visible td`, {
  background: tokens.color.background.muted,
});
export const unreadDot = style({
  background: tokens.color.text.accent,
  borderRadius: tokens.radius.full,
  display: 'inline-block',
  height: 7,
  marginRight: 8,
  verticalAlign: 'middle',
  width: 7,
});
