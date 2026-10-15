import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  margin: '0 auto',
  maxWidth: 1240,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});
export const embeddedPage = style({
  margin: 0,
  maxWidth: 'none',
  padding: 0,
});
export const header = style({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'space-between',
});
export const titleGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['1'],
});
export const sectionContext = style({
  fontSize: 14,
});
export const headerLinks = style({
  alignItems: 'flex-end',
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['2'],
});
export const backLink = style({
  color: tokens.color.text.accent,
  fontSize: 14,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  width: 'fit-content',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});
export const teamTitleLink = style({
  color: tokens.color.text.accent,
  textDecoration: 'underline',
  textDecorationColor: tokens.color.text.accent,
  textUnderlineOffset: 4,
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
});
export const thread = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  height: 'min(52vh, 520px)',
  minHeight: 300,
  overflowY: 'auto',
  padding: 20,
});
export const message = style({
  alignSelf: 'flex-start',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  maxWidth: '78%',
  minWidth: 0,
  padding: '12px 14px',
  width: 'fit-content',
});
export const ownMessage = style({
  alignSelf: 'flex-end',
});
export const messageHeader = style({
  alignItems: 'center',
  display: 'flex',
  gap: tokens.spacing['2'],
  justifyContent: 'space-between',
});
export const messageMeta = style({
  color: tokens.color.text.secondary,
  fontSize: 12,
});
export const messageContent = style({
  fontSize: 15,
  lineHeight: 1.6,
  overflowWrap: 'anywhere',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
});
export const submissionContext = style({
  alignItems: 'center',
  background: tokens.color.background.muted,
  borderRadius: 8,
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing['3'],
  justifyContent: 'space-between',
  padding: `${tokens.spacing['3']} ${tokens.spacing['4']}`,
});
export const relatedSubmissionLink = style({
  color: tokens.color.text.accent,
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none',
  ':hover': { textDecoration: 'underline' },
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: 2,
  },
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
  padding: tokens.spacing['4'],
});
export const composerType = style({
  alignItems: 'center',
  display: 'flex',
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
