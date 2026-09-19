import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const content = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  maxHeight: 'calc(100dvh - 80px)',
  overflow: 'hidden',
  wordBreak: 'keep-all',
});

export const description = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const body = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  minHeight: 0,
  overflowY: 'auto',
  paddingRight: 4,
});

export const actions = style({
  flex: '0 0 auto',
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
