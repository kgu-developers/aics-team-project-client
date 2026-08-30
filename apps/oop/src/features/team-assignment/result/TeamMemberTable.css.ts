import { globalStyle, style } from '@vanilla-extract/css';

export const table = style({
  height: 'auto',
  maxWidth: '100%',
  minWidth: 0,
  width: '100%',
});

globalStyle(`${table} table`, {
  '@media': {
    'screen and (max-width: 767px)': {
      minWidth: '0 !important',
      width: '100%',
    },
  },
});

globalStyle(`${table} th:first-child, ${table} td:first-child`, {
  '@media': {
    'screen and (max-width: 767px)': {
      display: 'none',
    },
  },
});
