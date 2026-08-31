import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const panel = style({
  display: 'grid',
  gap: 24,
  padding: 'clamp(20px, 4vw, 40px)',
});
export const header = style({ display: 'grid', gap: 8 });
export const description = style({ color: tokens.color.text.secondary });
export const section = style({ display: 'grid', gap: 12 });
export const historyList = style({ display: 'grid', gap: 8 });
export const historyItem = style({
  background: tokens.color.background.muted,
  borderRadius: 8,
  display: 'grid',
  gap: 6,
  padding: 14,
});
export const meta = style({ color: tokens.color.text.secondary, fontSize: 13 });
export const empty = style({ color: tokens.color.text.secondary });
export const response = style({
  background: tokens.color.background.muted,
  borderRadius: 8,
  display: 'grid',
  gap: 6,
  minHeight: 56,
  padding: 14,
  whiteSpace: 'pre-wrap',
});
export const actions = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
});
export const notice = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
});
