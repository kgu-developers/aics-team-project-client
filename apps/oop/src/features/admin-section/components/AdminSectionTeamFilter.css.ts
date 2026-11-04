import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  alignItems: 'flex-end',
  columnGap: tokens.spacing['3'],
  display: 'flex',
  flexWrap: 'wrap',
  rowGap: tokens.spacing['4'],
});

export const sectionTabs = style({
  flex: '1 1 100%',
  minWidth: 0,
});
