import { style } from '@vanilla-extract/css';

export const section = style({
  width: '100%',
});

export const header = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
});

export const headerActions = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
});

export const controls = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
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
