import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  margin: '0 auto',
  maxWidth: 1120,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});

export const titleRow = style({
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
});

export const backLink = style({
  color: tokens.color.text.accent,
  fontSize: 14,
  textDecoration: 'none',
  textUnderlineOffset: 3,
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});

export const progressRow = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
});

export const contentGrid = style({
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'minmax(0, 1.3fr) minmax(280px, 0.7fr)',
  '@media': {
    'screen and (max-width: 760px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
});

export const imageGrid = style({
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
});

export const screenCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  margin: 0,
});

export const screenImage = style({
  background: tokens.color.background.muted,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  display: 'block',
  maxHeight: 260,
  objectFit: 'contain',
  width: '100%',
});

export const screenCaption = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const list = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

export const item = style({
  borderBottom: `1px solid ${tokens.color.border.base}`,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  paddingBottom: 8,
});

export const artifactTextContent = style({
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
});

export const scoreRow = style({
  alignItems: 'center',
  borderBottom: `1px solid ${tokens.color.border.base}`,
  paddingBottom: 8,
});

export const link = style({
  color: tokens.color.text.accent,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});
