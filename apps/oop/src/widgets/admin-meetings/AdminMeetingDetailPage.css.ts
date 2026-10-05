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

export const titleRow = style({
  alignItems: 'center',
  display: 'flex',
  justifyContent: 'space-between',
});

export const backLink = style({
  color: tokens.color.text.accent,
  fontSize: 13,
  textDecoration: 'none',
});

export const document = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 28,
});

export const metadata = style({
  color: tokens.color.text.secondary,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  marginTop: 12,
});

export const participantList = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 10,
});

export const participant = style({
  background: tokens.color.background.muted,
  border: 0,
  borderRadius: 999,
  cursor: 'pointer',
  font: 'inherit',
  padding: '6px 10px',
});

export const teamLink = style({
  color: tokens.color.text.primary,
  textDecoration: 'none',
});

export const actionsSection = style({
  display: 'grid',
  gap: tokens.spacing[3],
});

export const editLogsSection = style({
  display: 'grid',
  gap: tokens.spacing[3],
});

export const actionsTitleRow = style({
  alignItems: 'end',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing[3],
  justifyContent: 'space-between',
});

export const actionsCard = style({
  minWidth: 0,
  padding: tokens.spacing[4],
});

export const actionsError = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing[3],
  justifyContent: 'space-between',
});

export const actionsPagination = style({
  justifySelf: 'end',
});
