import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const page = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['5'],
  margin: '0 auto',
  maxWidth: 1120,
  paddingBlock: tokens.spacing['4'],
  width: '100%',
  '@media': {
    'screen and (max-width: 767px)': {
      padding: `${tokens.spacing['4']} ${tokens.spacing['4']} ${tokens.spacing['8']}`,
    },
  },
});

export const heading = style({ margin: 0 });
export const tableCard = style({ overflowX: 'auto', padding: 0 });
export const table = style({
  borderCollapse: 'collapse',
  minWidth: 720,
  width: '100%',
});

globalStyle(`${table} th`, {
  background: tokens.color.background.card,
  color: tokens.color.text.secondary,
  fontSize: 13,
  fontWeight: 500,
  padding: '12px 16px',
  textAlign: 'left',
});

globalStyle(`${table} td`, {
  borderTop: `1px solid ${tokens.color.border.base}`,
  fontSize: 14,
  maxWidth: 440,
  overflow: 'hidden',
  padding: '14px 16px',
  textOverflow: 'ellipsis',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
});

export const messageRow = style({
  cursor: 'pointer',
});

globalStyle(`${messageRow}:hover td`, {
  background: tokens.color.background.muted,
});

export const unread = style({ fontWeight: 700 });
export const modal = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['4'],
  maxHeight: 'min(720px, calc(100dvh - 64px))',
  minWidth: 0,
});
export const modalHeader = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['1'],
});
export const readError = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing['2'],
  justifyContent: 'space-between',
});
export const thread = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
  minHeight: 160,
  overflowY: 'auto',
  padding: tokens.spacing['3'],
});
export const message = style({
  alignSelf: 'flex-start',
  background: tokens.color.background.muted,
  borderRadius: tokens.radius.chat,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['1'],
  maxWidth: '82%',
  padding: tokens.spacing['3'],
});
export const ownMessage = style({
  alignSelf: 'flex-end',
  background: tokens.color.background.card,
  border: `1px solid ${tokens.color.border.base}`,
});
export const messageMeta = style({ color: tokens.color.text.secondary });
export const composer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
});
export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
});
