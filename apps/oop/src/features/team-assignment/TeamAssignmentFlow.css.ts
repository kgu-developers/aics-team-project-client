import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: 24,
  minHeight: 0,
  width: '100%',
});

export const centeredStage = style({
  alignItems: 'center',
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: 16,
  justifyContent: 'center',
  textAlign: 'center',
});

export const illustration = style({
  alignSelf: 'center',
  height: 69,
  objectFit: 'contain',
  width: 96,
});

export const centeredCopy = style({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  textAlign: 'center',
});

export const waitingContent = style({
  alignItems: 'center',
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: 16,
  justifyContent: 'center',
  textAlign: 'center',
});
export const headline = style({
  color: tokens.color.text.primary,
  fontSize: '0.875rem',
  fontWeight: 600,
  margin: 0,
});

export const actions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  justifyContent: 'flex-end',
  marginTop: 'auto',
});

export const centeredActions = style({
  alignSelf: 'center',
  justifyContent: 'center',
  marginTop: 0,
  width: '100%',
});

export const partnerSearch = style({
  display: 'grid',
  gap: 12,
});

export const partnerCandidate = style({
  alignItems: 'center',
  background: tokens.color.background.card,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: 6,
  color: tokens.color.text.primary,
  cursor: 'pointer',
  display: 'flex',
  font: 'inherit',
  justifyContent: 'space-between',
  minHeight: 43,
  padding: '0 12px',
  textAlign: 'left',
  width: '100%',
  selectors: {
    '&:focus-visible': { outline: `2px solid ${tokens.color.accent}` },
  },
});

export const partnerRequest = style({
  background: tokens.color.background.muted,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: 8,
  display: 'grid',
  gap: 4,
  padding: 12,
});

export const requestActions = style({
  display: 'flex',
  gap: 8,
  marginTop: 4,
});
export const resultContent = style({
  alignSelf: 'center',
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: 24,
  justifyContent: 'center',
  padding: '32px 0',
  textAlign: 'center',
  width: 'min(100%, 360px)',
});

export const recoveryPage = style({
  alignItems: 'center',
  display: 'flex',
  flex: 1,
  flexDirection: 'column',
  gap: 24,
  justifyContent: 'center',
  textAlign: 'center',
});

export const recoveryContent = style({
  display: 'grid',
  gap: 8,
  maxWidth: 320,
});

export const resultDescription = style({
  textAlign: 'center',
});
export const waitAction = style({
  alignSelf: 'center',
  minWidth: 240,
});

export const unavailableAction = style({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

globalStyle(`${page} h1`, {
  color: tokens.color.text.primary,
  fontSize: '0.875rem',
  fontWeight: 600,
  margin: 0,
  textAlign: 'center',
});

globalStyle(`${page} h2`, {
  color: tokens.color.text.primary,
  fontSize: '0.875rem',
  margin: 0,
});

globalStyle(`${page} p`, {
  color: tokens.color.text.secondary,
  fontSize: '0.8125rem',
  lineHeight: 1.5,
  margin: 0,
});
