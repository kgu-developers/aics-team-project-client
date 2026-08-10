import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const pagePlaceholder = style({
  margin: '0 auto',
  maxWidth: 960,
  padding: '48px 32px',
  '@media': {
    '(max-width: 720px)': {
      padding: '32px 20px',
    },
  },
});

globalStyle(`${pagePlaceholder} h1`, {
  fontSize: 'clamp(2rem, 5vw, 3.25rem)',
  letterSpacing: '-0.04em',
  margin: 0,
});

export const content = style({
  gap: tokens.spacing['5'],
});

export const courseLabel = style({
  alignSelf: 'flex-start',
});

export const lead = style({
  margin: 0,
  maxWidth: 720,
});

export const todoCard = style({
  maxWidth: 720,
});

globalStyle(`${todoCard} h2`, {
  margin: `0 0 ${tokens.spacing['3']}`,
});

globalStyle(`${todoCard} ul`, {
  lineHeight: 1.8,
  margin: 0,
  paddingLeft: 20,
});
