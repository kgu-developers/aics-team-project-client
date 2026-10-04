import { style } from '@vanilla-extract/css';

export const teamRow = style({ width: '100%' });
export const teamName = style({ flex: 1 });
export const dateTimeRow = style({
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
});
export const errorText = style({ color: '#b42318' });
export const content = style({
  maxHeight: 'calc(100vh - 96px)',
  overflowY: 'auto',
  paddingRight: 4,
});
export const meetingLink = style({
  color: 'var(--color-text-accent)',
  textDecoration: 'underline',
});
export const dialogActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
  width: '100%',
});
export const closeButton = style({
  minWidth: 64,
  padding: '6px 14px',
});
