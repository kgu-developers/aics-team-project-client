import { tokens } from '@aics/design-system';
import { style, globalStyle } from '@vanilla-extract/css';

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[4],
  minWidth: 0,
});
export const heading = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: tokens.spacing[2],
});
export const controls = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing[2],
});

export const table = style({ minWidth: 0, width: '100%' });

export const cell = style({
  minWidth: 0,
  width: '100%',
  '@media': {
    'screen and (max-width: 767px)': {
      display: 'grid',
      gap: tokens.spacing[2],
    },
  },
});

export const mobileLabel = style({
  display: 'none',
  '@media': {
    'screen and (max-width: 767px)': {
      color: tokens.color.text.secondary,
      display: 'block',
      fontSize: 'var(--font-size-sm)',
      fontWeight: 500,
    },
  },
});

globalStyle(`${table} [data-aics-table-scroll-wrapper]`, {
  '@media': {
    'screen and (max-width: 767px)': {
      overflowX: 'visible',
    },
  },
});

globalStyle(`${table} table`, {
  '@media': {
    'screen and (max-width: 767px)': {
      display: 'block',
      minWidth: '0 !important',
      width: '100%',
    },
  },
});

globalStyle(`${table} thead`, {
  '@media': {
    'screen and (max-width: 767px)': {
      display: 'none',
    },
  },
});

globalStyle(`${table} tbody`, {
  '@media': {
    'screen and (max-width: 767px)': {
      display: 'grid',
      gap: tokens.spacing[3],
      width: '100%',
    },
  },
});

globalStyle(`${table} tbody tr`, {
  '@media': {
    'screen and (max-width: 767px)': {
      border: `1px solid ${tokens.color.border.base}`,
      borderRadius: tokens.radius.container,
      display: 'grid !important',
      gap: tokens.spacing[3],
      padding: tokens.spacing[4],
      width: '100%',
    },
  },
});

globalStyle(`${table} tbody td`, {
  '@media': {
    'screen and (max-width: 767px)': {
      border: '0 !important',
      display: 'block',
      maxWidth: 'none !important',
      minWidth: '0 !important',
      overflow: 'visible !important',
      padding: '0 !important',
      width: '100% !important',
    },
  },
});
