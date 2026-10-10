import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

import { layoutTokens } from '~/app/tokens.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: layoutTokens.page['section-gap'],
  margin: '0 auto',
  maxWidth: layoutTokens.workspace['content-width'],
  padding: `${layoutTokens.page['padding-y']} ${layoutTokens.page['padding-x']}`,
});

export const titleRow = style({
  alignItems: 'center',
  display: 'flex',
  gap: 20,
  justifyContent: 'space-between',
});

export const backLink = style({
  color: tokens.color.text.accent,
  flexShrink: 0,
  fontSize: 13,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});

export const errorActions = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
  justifyContent: 'center',
});

export const projectSummaryCard = style({
  alignItems: 'start',
  display: 'grid',
  gap: 24,
  gridTemplateColumns: 'minmax(0, 1fr) minmax(220px, 0.45fr)',
  '@media': {
    '(max-width: 720px)': { gridTemplateColumns: '1fr' },
  },
});

export const projectSummaryCopy = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const projectMetadata = style({
  display: 'grid',
  gap: 10,
  margin: 0,
});

globalStyle(`${projectMetadata} div`, {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: '72px minmax(0, 1fr)',
});

globalStyle(`${projectMetadata} dt`, {
  color: tokens.color.text.secondary,
});

globalStyle(`${projectMetadata} dd`, {
  margin: 0,
});

export const memberButton = style({
  background: 'transparent',
  border: 0,
  color: tokens.color.text.accent,
  cursor: 'pointer',
  font: 'inherit',
  padding: 0,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  selectors: {
    '&:focus-visible': {
      outline: `2px solid ${tokens.color.accent}`,
      outlineOffset: 2,
    },
  },
});
