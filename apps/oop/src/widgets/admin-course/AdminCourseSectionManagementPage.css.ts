import { style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  margin: '0 auto',
  maxWidth: 1160,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});
