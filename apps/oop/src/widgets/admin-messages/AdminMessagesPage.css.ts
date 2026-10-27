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
export const composePanel = style({
  background: tokens.color.background.card,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: 12,
  bottom: 24,
  boxShadow: '0 12px 32px rgb(10 19 23 / 18%)',
  display: 'flex',
  flexDirection: 'column',
  maxWidth: 'calc(100vw - 32px)',
  overflowY: 'auto',
  position: 'fixed',
  right: 24,
  top: 88,
  width: 400,
  zIndex: 20,
  '@media': {
    'screen and (max-width: 640px)': {
      bottom: 16,
      right: 16,
      top: 72,
      width: 'calc(100vw - 32px)',
    },
  },
});
export const composePanelContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['5'],
  padding: tokens.spacing['5'],
});
export const composePanelHeader = style({
  alignItems: 'center',
  cursor: 'grab',
  display: 'flex',
  justifyContent: 'space-between',
  selectors: {
    '&:active': { cursor: 'grabbing' },
  },
});
export const composeActions = style({
  display: 'flex',
  gap: tokens.spacing['2'],
  justifyContent: 'flex-end',
});
export const filterAction = style({
  marginLeft: 'auto',
});
export const tableCard = style({ overflowX: 'auto', padding: 0 });
export const table = style({
  borderCollapse: 'collapse',
  minWidth: 920,
  tableLayout: 'fixed',
  width: '100%',
});
export const readStateColumn = style({
  textAlign: 'center',
  width: 36,
});
export const sectionColumn = style({ width: 320 });
export const teamColumn = style({ width: 140 });
export const senderColumn = style({ width: 160 });
export const sectionContext = style({
  alignItems: 'center',
  display: 'flex',
  gap: tokens.spacing['2'],
  minWidth: 0,
});
export const typeBadge = style({ flexShrink: 0 });
export const metadataText = style({
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
export const messagePreview = style({
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});
export const visuallyHidden = style({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: 1,
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
  verticalAlign: 'middle',
});
globalStyle(`${table} th.${readStateColumn}`, {
  paddingLeft: 8,
  paddingRight: 4,
  width: 36,
});
globalStyle(`${table} td.${readStateColumn}`, {
  paddingLeft: 8,
  paddingRight: 4,
  width: 36,
});
globalStyle(`${table} th:nth-child(2)`, {
  paddingLeft: 4,
});
globalStyle(`${table} td:nth-child(2)`, {
  paddingLeft: 4,
});
globalStyle(table + ' tbody tr:hover td', {
  background: tokens.color.background.muted,
});
export const messageRow = style({ cursor: 'pointer' });
globalStyle(`${table} tbody tr:focus-visible td`, {
  background: tokens.color.background.muted,
});
