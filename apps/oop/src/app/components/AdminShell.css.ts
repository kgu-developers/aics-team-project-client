import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const shell = style({
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
  textDecoration: 'none',
};
export const navItem = style(navBase);
export const activeNav = style({
  ...navBase,
  background: 'rgba(255, 255, 255, 0.06)',
});
globalStyle(navItem + ':disabled', {
  color: tokens.color.text.disabled,
  cursor: 'not-allowed',
});
export const count = style({
  alignItems: 'center',
  background: tokens.color.accent,
  borderRadius: tokens.radius.full,
  color: tokens.color.background.surface,
  display: 'inline-flex',
  fontSize: 11,
  height: 20,
  justifyContent: 'center',
  width: 20,
});
globalStyle(navItem + ':disabled ' + count, {
  opacity: 0.6,
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
export const avatar = style({
  background: tokens.color.icon.disabled,
  borderRadius: '50%',
  display: 'block',
  height: 28,
  width: 28,
});
export const main = style({ minWidth: 0 });
globalStyle(brand + ' span, ' + account + ' span', {
  color: tokens.color.text.disabled,
  fontSize: 12,
});
globalStyle(brand + ' small', {
  color: tokens.color.text.disabled,
  fontSize: 11,
  marginTop: 8,
});
globalStyle(account + ' div', {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});
