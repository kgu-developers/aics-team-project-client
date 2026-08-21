import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const detailList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  margin: 0,
});

export const detailRow = style({
  display: 'grid',
  gap: 16,
  gridTemplateColumns: '72px minmax(0, 1fr)',
});

globalStyle(`${detailRow} dt`, {
  color: tokens.color.text.secondary,
});

globalStyle(`${detailRow} dd`, {
  margin: 0,
});
