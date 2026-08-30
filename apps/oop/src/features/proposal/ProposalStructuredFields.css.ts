import { globalStyle, style } from '@vanilla-extract/css';

export const dataComposition = style({
  minWidth: 0,
  width: '100%',
});

export const summary = style({
  alignItems: 'center',
  background: 'var(--color-background-muted)',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  justifyContent: 'space-between',
  padding: 'var(--spacing-4)',
});

export const actionCell = style({
  display: 'flex',
  justifyContent: 'flex-end',
});

export const tableWrapper = style({
  height: 'auto',
  maxWidth: '100%',
  minWidth: 0,
  width: '100%',
});

globalStyle(`${tableWrapper} > [data-aics-table-scroll-wrapper]`, {
  '@media': {
    'screen and (max-width: 1023px)': {
      overflowX: 'visible',
    },
  },
});

globalStyle(`${tableWrapper} table`, {
  '@media': {
    'screen and (max-width: 1023px)': {
      display: 'block',
      minWidth: '0 !important',
      width: '100%',
    },
  },
});

globalStyle(`${tableWrapper} thead`, {
  '@media': {
    'screen and (max-width: 1023px)': {
      border: 0,
      clip: 'rect(0 0 0 0)',
      height: 1,
      margin: -1,
      overflow: 'hidden',
      padding: 0,
      position: 'absolute',
      whiteSpace: 'nowrap',
      width: 1,
    },
  },
});

globalStyle(`${tableWrapper} tbody`, {
  '@media': {
    'screen and (max-width: 1023px)': {
      display: 'grid',
      gap: 'var(--spacing-3)',
    },
  },
});

globalStyle(`${tableWrapper} tbody tr`, {
  '@media': {
    'screen and (max-width: 1023px)': {
      background: 'var(--color-background-muted)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      display: 'grid',
      gap: 'var(--spacing-3)',
      gridTemplateColumns: 'minmax(0, 1fr)',
      padding: 'var(--spacing-3)',
    },
  },
});

globalStyle(`${tableWrapper} tbody td`, {
  '@media': {
    'screen and (max-width: 1023px)': {
      border: '0 !important',
      boxSizing: 'border-box',
      display: 'grid',
      gap: 'var(--spacing-2)',
      gridColumn: '1 / -1',
      maxWidth: 'none !important',
      minWidth: '0 !important',
      padding: '0 !important',
      width: 'auto !important',
    },
  },
});

export const responsiveCell = style({
  minWidth: 0,
  width: '100%',
});

globalStyle(`${responsiveCell}::before`, {
  color: 'var(--color-text-secondary)',
  content: 'attr(data-mobile-label)',
  display: 'none',
  fontSize: 'var(--font-size-sm)',
  fontWeight: 600,
  '@media': {
    'screen and (max-width: 1023px)': {
      display: 'block',
      marginBottom: 'var(--spacing-2)',
    },
  },
});

export const imagePreviewGrid = style({
  display: 'grid',
  gap: 'var(--spacing-3)',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
});
