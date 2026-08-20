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
export const filters = style({ display: 'flex', gap: 8 });
const filterBase = {
  background: tokens.color.background.gray,
  border: 0,
  borderRadius: tokens.radius.full,
  color: tokens.color.text.primary,
  cursor: 'pointer',
  font: 'inherit',
  padding: '7px 12px',
};
export const filter = style(filterBase);
export const filterActive = style({
  ...filterBase,
  background: tokens.color.text.primary,
  color: tokens.color.background.surface,
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
export const pagination = style({ display: 'flex', gap: 8, margin: '0 auto' });
globalStyle(pagination + ' button', {
  background: 'transparent',
  border: 0,
  cursor: 'pointer',
  font: 'inherit',
  minWidth: 28,
  padding: 5,
});
export const pageActive = style({
  background: tokens.color.accent + ' !important',
  borderRadius: tokens.radius.element,
  color: tokens.color.background.surface,
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
export const attachment = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginTop: 8,
});
export const attachmentLink = style({
  color: tokens.color.text.accent,
  fontSize: 13,
});
export const dialog = style({
  background: tokens.color.background.surface,
  border: 0,
  borderRadius: tokens.radius.container,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  margin: 'auto',
  maxHeight: 'calc(100vh - 48px)',
  maxWidth: 680,
  overflowY: 'auto',
  padding: 28,
  width: '100%',
});
globalStyle(`${dialog}::backdrop`, {
  background: 'rgb(0 0 0 / 0.36)',
});
export const deleteTitle = style({ color: tokens.color.text.red });
export const deletePreview = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 20,
});
export const modalActions = style({
  display: 'flex',
  gap: 8,
  justifyContent: 'flex-end',
});
export const deleteButton = style({
  background: tokens.color.background['error-inverted'],
  color: tokens.color['on-error'],
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
export const fieldGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});
export const selectWrapper = style({ position: 'relative', width: 160 });
export const selectButton = style({
  alignItems: 'center',
  background: tokens.color.background.surface,
  border: '1px solid ' + tokens.color.border.base,
  borderRadius: tokens.radius.element,
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  padding: '10px 12px',
  textAlign: 'left',
  width: '100%',
});
export const selectMenu = style({
  background: tokens.color.background.surface,
  border: '1px solid ' + tokens.color.border.base,
  borderRadius: tokens.radius.element,
  left: 0,
  listStyle: 'none',
  margin: '4px 0 0',
  padding: 4,
  position: 'absolute',
  top: '100%',
  width: '100%',
  zIndex: 1,
});
export const selectOption = style({
  background: 'transparent',
  border: 0,
  borderRadius: tokens.radius.element,
  cursor: 'pointer',
  padding: '8px',
  textAlign: 'left',
  width: '100%',
});
export const selectOptionActive = style([
  selectOption,
  { background: tokens.color.background.gray, color: tokens.color.text.accent },
]);
globalStyle(table + ' th', {
  background: tokens.color.background.gray,
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
globalStyle(attachment + ' a', {
  color: tokens.color.text.accent,
  fontSize: 13,
});
