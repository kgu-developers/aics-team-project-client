import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing[5],
  margin: '0 auto',
  maxWidth: 1240,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});

export const titleArea = style({
  display: 'grid',
  gap: tokens.spacing[2],
});

export const tableCard = style({
  minWidth: 0,
  padding: tokens.spacing[4],
  '@media': {
    'screen and (max-width: 767px)': {
      padding: tokens.spacing[2],
    },
  },
});

export const pagination = style({
  alignSelf: 'flex-end',
});
