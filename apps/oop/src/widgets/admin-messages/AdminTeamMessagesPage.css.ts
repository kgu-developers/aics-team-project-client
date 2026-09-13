import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  margin: '0 auto',
  maxWidth: 960,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});
export const header = style({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'space-between',
});
export const headerContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
});
export const headerActions = style({
  alignItems: 'flex-end',
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
});
export const backLink = style({
  color: tokens.color.text.accent,
  fontSize: 14,
  textDecoration: 'none',
  width: 'fit-content',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});
export const thread = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  minHeight: 360,
  padding: 20,
});
export const message = style({
  alignSelf: 'flex-start',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  maxWidth: '78%',
  padding: '12px 14px',
});
export const ownMessage = style({
  alignSelf: 'flex-end',
});
export const importantMessage = style({ borderColor: tokens.color.accent });
export const messageHeader = style({
  alignItems: 'center',
  display: 'flex',
  gap: tokens.spacing['2'],
  justifyContent: 'space-between',
});
export const messageMeta = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
});
export const senderButton = style({
  background: 'transparent',
  border: 0,
  color: 'inherit',
  cursor: 'pointer',
  font: 'inherit',
  padding: 0,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});
export const messageActions = style({
  display: 'flex',
  justifyContent: 'flex-end',
});
export const composer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 20,
});
export const typeActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
});
export const typeButton = style({ minWidth: 120 });
export const relatedNotice = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
});
