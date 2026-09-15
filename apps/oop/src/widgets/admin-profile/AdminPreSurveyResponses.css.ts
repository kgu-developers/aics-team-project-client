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
  display: 'flex',
  gap: 12,
  '@media': {
    '(max-width: 560px)': {
      alignItems: 'stretch',
      flexDirection: 'column',
    },
  },
});

export const sectionSelector = style({
  flex: 1,
  minWidth: 0,
});

export const table = style({
  minWidth: 0,
});
