import { style } from '@vanilla-extract/css';

export const section = style({
  width: '100%',
});

export const header = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const controls = style({
  alignItems: 'flex-end',
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'minmax(0, 1fr) minmax(180px, 0.45fr) auto',
  '@media': {
    '(max-width: 720px)': {
      alignItems: 'stretch',
      gridTemplateColumns: '1fr',
    },
  },
});

export const downloadButton = style({
  '@media': {
    '(max-width: 720px)': { width: '100%' },
  },
});

export const members = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
});
