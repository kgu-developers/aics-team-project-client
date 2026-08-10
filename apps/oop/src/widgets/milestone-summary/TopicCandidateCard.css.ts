import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const topic = style({
  background: tokens.color.background.card,
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 14,
});

export const topicVoted = style({
  background: tokens.color.background.blue,
});

export const topicHeader = style({
  alignItems: 'center',
  display: 'flex',
  gap: 8,
  minHeight: 36,
});

export const topicTitle = style({
  color: tokens.color.text.primary,
  fontSize: 14,
  fontWeight: 600,
  margin: 0,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const topicProposer = style({
  color: tokens.color.text.secondary,
  fontSize: 12,
  fontWeight: 400,
  margin: 0,
});

export const topicDesc = style({
  color: tokens.color.text.primary,
  display: '-webkit-box',
  fontSize: 12,
  fontWeight: 400,
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 2,
  margin: 0,
  overflow: 'hidden',
});

export const topicSpacer = style({
  flex: 1,
});

export const badge = style({
  alignItems: 'center',
  borderRadius: 9999,
  display: 'inline-flex',
  flex: 'none',
  fontSize: 11,
  fontWeight: 600,
  height: 24,
  padding: '4px 8px',
});

export const badgeBlue = style({
  background: tokens.color.accent,
  color: tokens.color['on-accent'],
});

export const badgeLight = style({
  background: tokens.color.background.gray,
  color: tokens.color.text.primary,
});
