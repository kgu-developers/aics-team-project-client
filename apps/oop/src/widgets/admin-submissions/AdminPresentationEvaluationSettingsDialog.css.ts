import { style } from '@vanilla-extract/css';

export const teamRow = style({ width: '100%' });
export const teamName = style({ flex: 1 });
export const errorText = style({ color: '#b42318' });
export const content = style({
  maxHeight: 'calc(100vh - 96px)',
  overflowY: 'auto',
  paddingRight: 4,
});
