import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 16,
});

export const guidance = style({
  alignItems: 'center',
  background: tokens.color.background.muted,
  borderRadius: 8,
  color: tokens.color.text.primary,
  display: 'flex',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.5,
  margin: 0,
  padding: 12,
});

export const panel = style({
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: 8,
  padding: 12,
});

export const panelTitle = style({
  color: tokens.color.text.primary,
  fontSize: 13,
  fontWeight: 600,
  margin: '0 0 10px',
});

export const topics = style({
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  '@media': {
    'screen and (max-width: 767px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const completion = style({
  display: 'flex',
  gap: 24,
  '@media': {
    'screen and (max-width: 767px)': {
      flexWrap: 'wrap',
      gap: '8px 16px',
    },
  },
});

export const completionLabel = style({
  color: tokens.color.text.primary,
  fontSize: 14,
  fontWeight: 500,
  margin: 0,
});

export const completionValue = style({
  color: tokens.color.text.accent,
  fontSize: 14,
  fontWeight: 500,
  margin: 0,
});

export const artifactList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

export const artifact = style({
  alignItems: 'center',
  background: tokens.color.background.muted,
  borderRadius: 8,
  display: 'flex',
  gap: 12,
  justifyContent: 'space-between',
  padding: 12,
  '@media': {
    'screen and (max-width: 767px)': {
      alignItems: 'flex-start',
      flexDirection: 'column',
    },
  },
});

export const artifactLabel = style({
  color: tokens.color.text.primary,
  fontSize: 13,
  fontWeight: 600,
  margin: 0,
});

export const artifactDetail = style({
  color: tokens.color.text.secondary,
  fontSize: 12,
  margin: '4px 0 0',
});

export const statusWithLabel = style({
  alignItems: 'center',
  display: 'inline-flex',
  flex: 'none',
  gap: 6,
});

export const statusText = style({
  color: tokens.color.text.secondary,
  fontSize: 12,
  fontWeight: 500,
});

export const notice = style({
  background: tokens.color.background.muted,
  borderRadius: 8,
  color: tokens.color.text.secondary,
  fontSize: 12,
  lineHeight: 1.5,
  margin: 0,
  padding: '10px 12px',
});

export const projectTitle = style({
  color: tokens.color.text.accent,
  fontSize: 16,
  fontWeight: 600,
  margin: 0,
});

export const projectDescription = style({
  color: tokens.color.text.primary,
  fontSize: 12,
  lineHeight: 1.6,
  margin: '6px 0 0',
});

export const contentList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

export const contentItem = style({
  alignItems: 'center',
  display: 'flex',
  gap: 12,
  justifyContent: 'space-between',
  minHeight: 32,
  '@media': {
    'screen and (max-width: 767px)': {
      alignItems: 'flex-start',
      flexDirection: 'column',
      gap: 4,
    },
  },
});

export const contentLabel = style({
  color: tokens.color.text.primary,
  fontSize: 12,
  margin: 0,
});

export const contentUpdatedAt = style({
  color: tokens.color.text.secondary,
  fontSize: 11,
  margin: '2px 0 0',
});
