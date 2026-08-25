import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const dashboard = style({
  background: tokens.color.background.body,
  display: 'grid',
  gridTemplateColumns: '240px minmax(0, 1fr)',
  minHeight: '100dvh',
  '@media': { '(max-width: 900px)': { gridTemplateColumns: '1fr' } },
});
export const sidebar = style({
  background: tokens.color.text.primary,
  color: tokens.color.background.surface,
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100%',
  padding: '24px 16px 16px',
});
export const brand = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  padding: '0 10px',
});
export const nav = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  marginTop: 58,
});
const navBase = {
  alignItems: 'center',
  background: 'transparent',
  border: 0,
  borderRadius: tokens.radius.container,
  color: tokens.color.background.surface,
  cursor: 'pointer',
  display: 'flex',
  font: 'inherit',
  justifyContent: 'space-between',
  minHeight: 42,
  padding: '0 12px',
  textAlign: 'left' as const,
};
export const navItem = style(navBase);
export const activeNav = style({
  ...navBase,
  background: 'rgba(255, 255, 255, 0.06)',
});
export const count = style({
  alignItems: 'center',
  background: tokens.color.accent,
  borderRadius: 999,
  color: tokens.color.background.surface,
  display: 'inline-flex',
  fontSize: 11,
  height: 20,
  justifyContent: 'center',
  width: 20,
});
export const account = style({
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.08)',
  borderRadius: tokens.radius.container,
  display: 'flex',
  gap: 10,
  marginTop: 'auto',
  padding: 12,
});
globalStyle(account + ' div', {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});
export const avatar = style({
  background: tokens.color.icon.disabled,
  borderRadius: '50%',
  display: 'block',
  height: 28,
  width: 28,
});
export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
  margin: '0 auto',
  maxWidth: 1240,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});
export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  minWidth: 0,
});
export const sectionHeader = style({
  alignItems: 'center',
  display: 'flex',
  gap: 12,
  justifyContent: 'space-between',
});
export const tableWrap = style({
  background: tokens.color.background.surface,
  border: '1px solid ' + tokens.color.border.base,
  borderRadius: tokens.radius.container,
  overflowX: 'auto',
});
export const table = style({
  borderCollapse: 'collapse',
  fontSize: 12,
  minWidth: 940,
  tableLayout: 'fixed',
  width: '100%',
});
export const scheduleState = style({
  color: tokens.color.text.secondary,
  margin: 0,
  padding: 24,
});
export const grid = style({
  display: 'grid',
  gap: 28,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media': { '(max-width: 720px)': { gridTemplateColumns: '1fr' } },
});
export const more = style({
  background: 'transparent',
  border: 0,
  color: tokens.color.text.accent,
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 13,
  padding: 0,
});
export const panel = style({
  background: tokens.color.background.surface,
  border: '1px solid ' + tokens.color.border.base,
  borderRadius: tokens.radius.container,
  minHeight: 138,
  padding: 12,
});
export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  listStyle: 'none',
  margin: 0,
  padding: 0,
});
export const item = style({
  alignItems: 'center',
  display: 'grid',
  gap: 8,
  gridTemplateColumns: 'auto minmax(0, 1fr) auto',
  minHeight: 22,
});
export const label = style({
  background: tokens.color.background.gray,
  borderRadius: 999,
  color: tokens.color.text.secondary,
  fontSize: 11,
  padding: '3px 7px',
  whiteSpace: 'nowrap',
});
export const itemTitle = style({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
export const action = style({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: 14,
});
globalStyle(table + ' th', {
  background: tokens.color.background.gray,
  color: tokens.color.text.secondary,
  fontWeight: 500,
  padding: '10px 8px',
  textAlign: 'left',
});
globalStyle(table + ' td', {
  borderTop: '1px solid ' + tokens.color.border.base,
  padding: '10px 8px',
  whiteSpace: 'pre-line',
});
globalStyle(brand + ' span, ' + account + ' span', {
  color: tokens.color.text.disabled,
  fontSize: 12,
});
globalStyle(brand + ' small', {
  color: tokens.color.text.disabled,
  fontSize: 11,
  marginTop: 8,
});
