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
  maxHeight: 'calc(100dvh - 64px)',
  minWidth: 0,
  overflowY: 'auto',
});

export const dialogTitle = style({
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
});

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['3'],
});

export const sectionSettingsForm = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
  maxHeight: 'calc(100dvh - 64px)',
  minWidth: 0,
  overflowY: 'auto',
});

export const optionalSettings = style({
  background: tokens.color.background.muted,
  borderRadius: tokens.radius.container,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['1'],
  padding: tokens.spacing['2'],
});

export const optionalSettingsHeader = style({
  alignItems: 'flex-start',
});

export const optionalSettingsStatus = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
  whiteSpace: 'nowrap',
});

export const formRow = style({
  display: 'grid',
  gap: tokens.spacing['2'],
  gridTemplateColumns: '1fr',
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

export const sectionList = style({
  display: 'grid',
  gap: tokens.spacing['2'],
  listStyle: 'none',
  margin: 0,
  minWidth: 0,
  padding: 0,
});

export const sectionItem = style({
  alignItems: 'start',
  background: tokens.color.background.muted,
  borderRadius: tokens.radius.element,
  display: 'grid',
  gap: tokens.spacing['1'],
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 0.8fr)',
  minWidth: 0,
  padding: tokens.spacing['3'],
  '@media': {
    '(max-width: 480px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const sectionEditButton = style({
  gridColumn: '1 / -1',
});

export const sectionMeta = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
  minWidth: 0,
  overflowWrap: 'anywhere',
  textAlign: 'right',
  wordBreak: 'break-word',
  '@media': {
    '(max-width: 480px)': {
      textAlign: 'left',
    },
  },
});

export const sectionCode = style({
  minWidth: 0,
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
});

export const assistantRow = style({
  alignItems: 'center',
  borderTop: `1px solid ${tokens.color.border.base}`,
  paddingTop: tokens.spacing['2'],
});

export const assistantManagement = style({
  background: tokens.color.background.card,
  borderRadius: tokens.radius.element,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
  gridColumn: '1 / -1',
  minWidth: 0,
  padding: tokens.spacing['2'],
});

export const assistantActions = style({
  flexShrink: 0,
});

export const assistantManagementAction = style({
  display: 'flex',
  justifyContent: 'flex-end',
});
