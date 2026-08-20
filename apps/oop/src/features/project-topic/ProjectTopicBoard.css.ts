import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
});
export const header = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});
export const title = style({
  color: tokens.color.text.primary,
  fontSize: 28,
  margin: 0,
});
export const description = style({
  color: tokens.color.text.secondary,
  margin: 0,
});
export const boardHeader = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  justifyContent: 'space-between',
});
export const boardTitle = style({
  color: tokens.color.text.primary,
  fontSize: 20,
  margin: 0,
});
export const participation = style({
  color: tokens.color.text.secondary,
  fontSize: 14,
  margin: 0,
});
export const candidateList = style({
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media': { 'screen and (max-width: 720px)': { gridTemplateColumns: '1fr' } },
});
export const candidate = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});
export const candidateVoted = style({
  background: tokens.color.background.blue,
});
export const candidateTop = style({
  alignItems: 'flex-start',
  display: 'flex',
  gap: 8,
  justifyContent: 'space-between',
});
export const candidateTitle = style({
  color: tokens.color.text.primary,
  fontSize: 17,
  margin: 0,
});
export const candidateMeta = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
  margin: 0,
});
export const candidateDescription = style({
  color: tokens.color.text.primary,
  fontSize: 14,
  margin: 0,
});
export const candidateActions = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  justifyContent: 'space-between',
});
export const voteCount = style({
  color: tokens.color.text.secondary,
  fontSize: 14,
  margin: 0,
});
export const ownCandidateNotice = style({
  color: tokens.color.text.secondary,
  fontSize: 14,
  margin: 0,
});
export const candidateEnd = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
});
export const voteActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  justifyContent: 'flex-end',
});
export const error = style({ color: tokens.color.text.red, margin: 0 });
