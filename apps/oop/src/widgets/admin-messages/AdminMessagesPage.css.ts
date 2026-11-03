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
export const filterAction = style({
  flexShrink: 0,
});
export const messageToolbar = style({
  alignItems: 'end',
  display: 'flex',
  flex: '1 1 360px',
  flexWrap: 'wrap',
  gap: tokens.spacing['3'],
  justifyContent: 'space-between',
  minWidth: 0,
});
export const senderSearch = style({
  alignItems: 'end',
  display: 'flex',
  flex: '1 1 240px',
  gap: tokens.spacing['2'],
  maxWidth: 320,
  minWidth: 0,
});
export const dateSortButton = style({
  marginLeft: `calc(-1 * ${tokens.spacing['2']})`,
});
export const tableCard = style({ overflowX: 'auto', padding: 0 });
export const table = style({
  borderCollapse: 'collapse',
  minWidth: 880,
  tableLayout: 'fixed',
  width: '100%',
});
export const readStateColumn = style({
  textAlign: 'center',
  width: 28,
});
export const sectionColumn = style({ width: 190 });
export const teamColumn = style({ width: 176 });
export const createdAtColumn = style({ whiteSpace: 'nowrap', width: 184 });
export const senderColumn = style({ width: 132 });
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
export const broadcastTeamContext = style({
  display: 'grid',
  gap: tokens.spacing['1'],
  minWidth: 0,
});
export const broadcastRepresentative = style({
  color: tokens.color.text.secondary,
  display: 'block',
  fontSize: 12,
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
  padding: '12px',
  textAlign: 'left',
});
globalStyle(table + ' td', {
  borderTop: '1px solid ' + tokens.color.border.base,
  fontSize: 14,
  padding: '14px 12px',
  verticalAlign: 'middle',
});
globalStyle(`${table} th.${readStateColumn}`, {
  paddingLeft: 4,
  paddingRight: 0,
  width: 28,
});
globalStyle(`${table} td.${readStateColumn}`, {
  paddingLeft: 4,
  paddingRight: 0,
  width: 28,
});
globalStyle(`${table} th.${createdAtColumn}`, {
  paddingLeft: 4,
  paddingRight: 20,
});
globalStyle(`${table} td.${createdAtColumn}`, {
  paddingLeft: 4,
  paddingRight: 20,
});
globalStyle(table + ' tbody tr:hover td', {
  background: tokens.color.background.muted,
});
export const messageRow = style({ cursor: 'pointer' });
globalStyle(`${table} tbody tr:focus-visible td`, {
  background: tokens.color.background.muted,
});
