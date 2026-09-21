import { globalStyle, style } from '@vanilla-extract/css';

export const table = style({
  height: 'auto',
  maxWidth: '100%',
  minWidth: 0,
  width: '100%',
});

export const hideDepartmentOnMobile = style({});

globalStyle(`${table} table`, {
  '@media': {
    'screen and (max-width: 767px)': {
      minWidth: '0 !important',
      width: '100%',
    },
  },
});

globalStyle(
  `${table}.${hideDepartmentOnMobile} th:first-child, ${table}.${hideDepartmentOnMobile} td:first-child`,
  {
    '@media': {
      'screen and (max-width: 767px)': {
        display: 'none',
      },
    },
  },
);
