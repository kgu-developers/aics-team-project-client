import { style } from '@vanilla-extract/css';

export const content = style({
  maxHeight: 'calc(100vh - 96px)',
  overflowY: 'auto',
  paddingRight: 4,
});

export const unevaluatedTeams = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  margin: 0,
  paddingLeft: 20,
});
