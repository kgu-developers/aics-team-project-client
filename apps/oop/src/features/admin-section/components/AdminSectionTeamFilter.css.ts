import { style } from '@vanilla-extract/css';

export const root = style({
  alignItems: 'flex-end',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
});

export const sectionTabs = style({
  flex: '1 1 100%',
  minWidth: 0,
});
