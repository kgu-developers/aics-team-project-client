import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const document = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-5)',
  padding: 'clamp(24px, 4vw, 40px)',
  minWidth: 0,
});
export const header = style({
  borderBottom: `1px solid ${tokens.color.border.base}`,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['3'],
  paddingBottom: tokens.spacing['5'],
});
export const eyebrow = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
  fontWeight: 600,
});
export const summary = style({
  display: 'grid',
  gap: tokens.spacing['4'],
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  margin: 0,
  '@media': {
    'screen and (max-width: 640px)': { gridTemplateColumns: '1fr' },
  },
});
globalStyle(`${summary} div`, { display: 'grid', gap: tokens.spacing['1'] });
globalStyle(`${summary} dt`, {
  color: tokens.color.text.secondary,
  fontSize: 13,
});
globalStyle(`${summary} dd`, { fontWeight: 600, margin: 0 });
export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--spacing-3)',
  margin: 0,
  selectors: {
    '& + &': {
      borderTop: `1px solid ${tokens.color.border.base}`,
      paddingTop: tokens.spacing['5'],
    },
  },
});
export const item = style({
  background: tokens.color.background.muted,
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
  margin: 0,
  padding: tokens.spacing['4'],
});
export const itemTitle = style({ fontWeight: 600 });
export const teamLink = style({
  color: tokens.color.text.accent,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});
export const content = style({
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
});
export const image = style({
  maxWidth: '100%',
  maxHeight: 480,
  objectFit: 'contain',
  alignSelf: 'flex-start',
});
