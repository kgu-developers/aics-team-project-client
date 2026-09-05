import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const page = style({
  boxSizing: 'border-box',
  display: 'grid',
  gap: tokens.spacing[5],
  margin: '0 auto',
  maxWidth: 1080,
  minWidth: 0,
  padding: `${tokens.spacing[5]} 0`,
  width: '100%',
  '@media': {
    'screen and (max-width: 767px)': {
      padding: `${tokens.spacing[5]} ${tokens.spacing[4]} ${tokens.spacing[8]}`,
    },
  },
});

export const titleRow = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing[3],
  justifyContent: 'space-between',
});

export const filterBar = style({
  alignItems: 'end',
  display: 'grid',
  gap: tokens.spacing[3],
  gridTemplateColumns: 'minmax(160px, 220px) minmax(160px, 220px) 1fr',
  minWidth: 0,
  '@media': {
    'screen and (max-width: 767px)': {
      alignItems: 'stretch',
      gridTemplateColumns: '1fr',
    },
  },
});

export const tableCard = style({
  minWidth: 0,
  padding: tokens.spacing[4],
  '@media': {
    'screen and (max-width: 1023px)': {
      padding: 0,
    },
  },
});

export const tableFrame = style({
  minWidth: 0,
  width: '100%',
});

export const cell = style({
  display: 'grid',
  gap: tokens.spacing[1],
  minWidth: 0,
});

export const mobileActionMeta = style({
  color: tokens.color.text.secondary,
  display: 'none',
  fontSize: 'var(--font-size-sm)',
  overflowWrap: 'anywhere',
  '@media': {
    'screen and (max-width: 1023px)': {
      display: 'block',
    },
  },
});

export const actionText = style({
  color: tokens.color.text.accent,
  maxWidth: '100%',
  overflowWrap: 'anywhere',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  width: 'fit-content',
  ':hover': {
    textDecorationThickness: 2,
  },
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});

export const desktopEditButton = style({
  display: 'block',
  '@media': {
    'screen and (max-width: 1023px)': {
      display: 'none',
    },
  },
});

export const mobileEditButton = style({
  display: 'none',
  '@media': {
    'screen and (max-width: 1023px)': {
      display: 'flex',
      justifyContent: 'center',
    },
  },
});

export const dialogForm = style({
  display: 'grid',
  gap: tokens.spacing[4],
});

export const dialogActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing[2],
  justifyContent: 'end',
});

export const error = style({
  color: tokens.color.text.red,
});

export const emptyCell = style({
  color: tokens.color.text.secondary,
  padding: `${tokens.spacing[8]} ${tokens.spacing[4]}`,
  textAlign: 'center',
});

globalStyle(`${tableFrame} [data-aics-table-scroll-wrapper]`, {
  '@media': {
    'screen and (max-width: 1023px)': {
      overflowX: 'hidden',
    },
  },
});

globalStyle(`${tableFrame} table`, {
  '@media': {
    'screen and (max-width: 1023px)': {
      minWidth: '0 !important',
      tableLayout: 'fixed',
      width: '100%',
    },
  },
});

globalStyle(`${tableFrame} th:nth-child(1), ${tableFrame} td:nth-child(1)`, {
  '@media': {
    'screen and (max-width: 1023px)': {
      display: 'none !important',
    },
  },
});

globalStyle(`${tableFrame} th:nth-child(3), ${tableFrame} td:nth-child(3)`, {
  '@media': {
    'screen and (max-width: 1023px)': {
      display: 'none !important',
    },
  },
});

globalStyle(`${tableFrame} th:nth-child(2), ${tableFrame} td:nth-child(2)`, {
  '@media': {
    'screen and (max-width: 1023px)': {
      maxWidth: 'none !important',
      minWidth: '0 !important',
      width: '55% !important',
    },
  },
});

globalStyle(`${tableFrame} th:nth-child(4), ${tableFrame} td:nth-child(4)`, {
  '@media': {
    'screen and (max-width: 1023px)': {
      maxWidth: 'none !important',
      minWidth: '0 !important',
      width: '32% !important',
    },
  },
});

globalStyle(`${tableFrame} th:nth-child(5), ${tableFrame} td:nth-child(5)`, {
  '@media': {
    'screen and (max-width: 1023px)': {
      maxWidth: 'none !important',
      minWidth: '40px !important',
      paddingLeft: `${tokens.spacing[1]} !important`,
      paddingRight: `${tokens.spacing[1]} !important`,
      textAlign: 'center',
      width: '13% !important',
    },
  },
});

globalStyle(`${tableFrame} tbody td`, {
  '@media': {
    'screen and (max-width: 1023px)': {
      verticalAlign: 'middle',
    },
  },
});
