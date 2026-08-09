import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

import { pagePlaceholder } from '../../course/components/PagePlaceholder.css';

export const shell = style({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'center',
  minHeight: '100dvh',
  padding: 24,
});

export const shellCard = style({
  width: 'min(100%, 460px)',
});

export const eyebrow = style({
  color: tokens.color.text.secondary,
  fontSize: '0.875rem',
  margin: 0,
});

globalStyle(`${shell} ${pagePlaceholder}`, {
  padding: `${tokens.spacing['4']} 0 0`,
});

globalStyle(`${shell} ${pagePlaceholder} h1`, {
  fontSize: 'clamp(1.75rem, 8vw, 2.5rem)',
});
