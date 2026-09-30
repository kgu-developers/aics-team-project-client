import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const content = style({
  maxHeight: 'calc(100vh - 96px)',
  overflowY: 'auto',
  paddingRight: 4,
});

export const summary = style({
  background: tokens.color.background.muted,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: 16,
});
