import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  margin: '0 auto',
  maxWidth: 1160,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});

export const header = style({
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 16,
  justifyContent: 'space-between',
});

export const filters = style({
  alignItems: 'flex-end',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
});

export const courseSelector = style({
  minWidth: 280,
});

export const courseCard = style({
  minWidth: 0,
});

export const courseSummary = style({
  alignItems: 'center',
  display: 'grid',
  gap: tokens.spacing['6'],
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  '@media': {
    '(max-width: 720px)': {
      alignItems: 'stretch',
      gap: tokens.spacing['4'],
      gridTemplateColumns: '1fr',
    },
  },
});

export const courseIdentity = style({
  minWidth: 0,
});

export const courseTitleRow = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing['2'],
});

export const courseMetadata = style({
  borderLeft: `1px solid ${tokens.color.border.base}`,
  display: 'grid',
  gap: tokens.spacing['6'],
  gridTemplateColumns: 'repeat(2, minmax(112px, auto))',
  margin: 0,
  paddingLeft: tokens.spacing['6'],
  '@media': {
    '(max-width: 720px)': {
      borderLeft: 0,
      borderTop: `1px solid ${tokens.color.border.base}`,
      gap: tokens.spacing['4'],
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
      paddingLeft: 0,
      paddingTop: tokens.spacing['4'],
    },
    '(max-width: 420px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const courseMetadataItem = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['1'],
});

export const courseMetadataLabel = style({
  color: tokens.color.text.secondary,
  fontSize: 13,
});

export const courseMetadataValue = style({
  color: tokens.color.text.primary,
  fontSize: 16,
  fontWeight: 600,
  margin: 0,
});

export const courseCardHeader = style({
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
});

export const courseActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const sectionHeader = style({
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
});

export const clickableRow = style({
  cursor: 'pointer',
  ':focus-visible': {
    outline: `2px solid ${tokens.color.accent}`,
    outlineOffset: -2,
  },
});

export const rowChevron = style({
  color: tokens.color.icon.accent,
  display: 'inline-block',
  fontSize: 22,
  fontWeight: 600,
  lineHeight: 1,
});
