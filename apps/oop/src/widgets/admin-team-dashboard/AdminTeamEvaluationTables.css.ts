import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const evaluatorButton = style({
  background: 'none',
  border: 0,
  color: tokens.color.text.accent,
  cursor: 'pointer',
  font: 'inherit',
  padding: 0,
  textAlign: 'left',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});

export const emptyCell = style({
  color: tokens.color.text.secondary,
  display: 'block',
  paddingBlock: 12,
  textAlign: 'center',
});

export const responseGrid = style({
  display: 'grid',
  gap: 12,
  gridTemplateColumns: '140px minmax(0, 1fr)',
  '@media': {
    'screen and (max-width: 720px)': { gridTemplateColumns: '1fr' },
  },
});

export const responseTitle = style({ fontWeight: 700 });

export const peerResponseGroup = style({ display: 'contents' });

export const peerResponseBody = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 0,
});
