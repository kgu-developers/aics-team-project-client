import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

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
  textDecoration: 'none',
});

export const errorActions = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
  justifyContent: 'center',
});

export const teamInfoCard = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const memberList = style({
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

export const memberCard = style({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  height: '100%',
  minWidth: 0,
});

export const memberButton = style({
  background: 'transparent',
  border: 0,
  color: tokens.color.text.primary,
  cursor: 'pointer',
  font: 'inherit',
  fontWeight: 600,
  padding: 2,
  selectors: {
    '&:focus-visible': {
      outline: `2px solid ${tokens.color.accent}`,
      outlineOffset: 2,
    },
  },
});

export const studentNumber = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
});

export const memberBadges = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  justifyContent: 'center',
});
