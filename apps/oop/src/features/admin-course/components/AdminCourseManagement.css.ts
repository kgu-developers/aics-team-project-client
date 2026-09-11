import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['4'],
});

export const heading = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['1'],
});

export const filters = style({
  display: 'grid',
  gap: tokens.spacing['2'],
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  '@media': { '(max-width: 720px)': { gridTemplateColumns: '1fr' } },
});

export const tableWrap = style({
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  overflowX: 'auto',
});

export const table = style({
  borderCollapse: 'collapse',
  minWidth: 760,
  width: '100%',
});

globalStyle(`${table} th`, {
  background: tokens.color.background.muted,
  color: tokens.color.text.secondary,
  fontSize: 13,
  fontWeight: 500,
  padding: '12px 16px',
  textAlign: 'left',
});

globalStyle(`${table} td`, {
  borderTop: `1px solid ${tokens.color.border.base}`,
  fontSize: 14,
  padding: '14px 16px',
});

export const rowActions = style({
  display: 'flex',
  gap: tokens.spacing['1'],
  justifyContent: 'flex-end',
});

export const status = style({
  color: tokens.color.text.secondary,
  whiteSpace: 'nowrap',
});

export const dialogBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['3'],
});

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['3'],
});

export const formRow = style({
  display: 'grid',
  gap: tokens.spacing['2'],
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media': { '(max-width: 520px)': { gridTemplateColumns: '1fr' } },
});

export const dialogActions = style({
  display: 'flex',
  gap: tokens.spacing['2'],
  justifyContent: 'flex-end',
  paddingTop: tokens.spacing['1'],
});

export const error = style({
  color: tokens.color.text.red,
  margin: 0,
});

export const deletePreview = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['1'],
});

export const deleteHint = style({
  color: tokens.color.text.secondary,
  fontSize: 12,
  margin: '6px 0 0',
});

export const sectionList = style({
  display: 'grid',
  gap: tokens.spacing['2'],
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

export const sectionItem = style({
  alignItems: 'center',
  background: tokens.color.background.muted,
  borderRadius: tokens.radius.element,
  display: 'grid',
  gap: tokens.spacing['1'],
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  padding: tokens.spacing['3'],
});

export const sectionMeta = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
});
