import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const dialog = style({
  background: tokens.color.background.surface,
  border: 0,
  borderRadius: tokens.radius.container,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  margin: 'auto',
  maxWidth: 480,
  padding: 28,
  selectors: {
    '&:not([open])': {
      display: 'none',
    },
  },
  width: 'calc(100% - 40px)',
});

globalStyle(`${dialog}::backdrop`, {
  background: 'rgb(0 0 0 / 0.36)',
});

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

export const modalActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
});
