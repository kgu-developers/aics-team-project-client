import { style } from '@vanilla-extract/css';

export const teamRow = style({ width: '100%' });
export const teamName = style({ flex: 1 });
export const dateTimeRow = style({
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
});
export const timeInput = style({
  appearance: 'none',
  background: '#fff',
  border: '1px solid #c7d2df',
  borderRadius: 8,
  boxSizing: 'border-box',
  color: '#172b4d',
  font: 'inherit',
  minHeight: 40,
  padding: '8px 12px',
  width: '100%',
});
export const errorText = style({ color: '#b42318' });
export const content = style({
  maxHeight: 'calc(100vh - 96px)',
  overflowY: 'auto',
  paddingRight: 4,
});
