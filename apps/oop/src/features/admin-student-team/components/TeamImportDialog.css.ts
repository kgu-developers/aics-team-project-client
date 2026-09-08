import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const summary = style({
  background: tokens.color.background.muted,
  borderRadius: tokens.radius.element,
  display: 'grid',
  gap: 8,
  gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))',
  padding: 12,
});

export const previewTableWrap = style({
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.element,
  maxHeight: 280,
  overflow: 'auto',
});

export const previewTable = style({
  borderCollapse: 'collapse',
  fontSize: 13,
  minWidth: 640,
  width: '100%',
});

globalStyle(`${previewTable} th, ${previewTable} td`, {
  borderBottom: `1px solid ${tokens.color.border.base}`,
  padding: '8px 10px',
  textAlign: 'left',
  verticalAlign: 'top',
});

globalStyle(`${previewTable} th`, {
  background: tokens.color.background.card,
  color: tokens.color.text.secondary,
  position: 'sticky',
  top: 0,
});
