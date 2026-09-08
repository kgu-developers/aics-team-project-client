import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const detailList = style({
  display: 'grid',
  gap: 0,
  margin: 0,
});

globalStyle(`${detailList} > div`, {
  borderBottom: `1px solid ${tokens.color.border.base}`,
  display: 'grid',
  gap: 12,
  gridTemplateColumns: '96px minmax(0, 1fr)',
  padding: '10px 0',
});

globalStyle(`${detailList} dt`, {
  color: tokens.color.text.secondary,
});

globalStyle(`${detailList} dd`, {
  margin: 0,
  overflowWrap: 'anywhere',
});
