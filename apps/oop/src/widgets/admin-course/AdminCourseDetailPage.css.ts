import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  margin: '0 auto',
  maxWidth: 1160,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});

export const summaryCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const summaryHeader = style({
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
});

export const summaryTitle = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
});

export const summaryActions = style({
  display: 'flex',
  gap: 8,
});

export const block = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const blockHeader = style({
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
});

export const clickableRow = style({
  cursor: 'pointer',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: -2,
  },
});

export const assistantCell = style({
  alignItems: 'center',
  display: 'inline-flex',
  gap: 8,
});

export const uploadGrid = style({
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media': {
    '(max-width: 720px)': { gridTemplateColumns: '1fr' },
  },
});

export const uploadCard = style({
  alignItems: 'flex-start',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const uploadCopy = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});
