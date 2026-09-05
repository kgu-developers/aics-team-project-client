import { style } from '@vanilla-extract/css';

export const section = style({
  width: '100%',
});

export const header = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const table = style({
  minWidth: 0,
});
