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

export const sectionBanner = style({
  background: tokens.color.background.muted,
  borderRadius: 8,
  color: tokens.color.text.primary,
  fontSize: 13,
  fontWeight: 500,
  margin: 0,
  padding: 12,
});

export const projectSummary = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
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
  margin: 0,
  whiteSpace: 'pre-line',
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

export const feedbackList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const feedbackItem = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
});

export const feedbackTitle = style({
  color: tokens.color.text.accent,
  fontSize: 16,
  fontWeight: 600,
  margin: 0,
});

export const feedbackContent = style({
  color: tokens.color.text.primary,
  fontSize: 12,
  lineHeight: 1.6,
  margin: 0,
  whiteSpace: 'pre-line',
});

export const replyComposer = style({
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: 8,
  padding: 12,
});

export const replyPlaceholder = style({
  color: tokens.color.text.disabled,
  fontSize: 13,
  fontWeight: 400,
  margin: 0,
});

export const sectionList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  listStyle: 'none',
  margin: 0,
  padding: 0,
});

export const sectionRow = style({
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

export const sectionLink = style({
  alignItems: 'center',
  display: 'flex',
  flex: 1,
  gap: 12,
  justifyContent: 'space-between',
  minHeight: 32,
  textDecoration: 'none',
  '@media': {
    'screen and (max-width: 767px)': {
      alignItems: 'flex-start',
      flexDirection: 'column',
      gap: 4,
    },
  },
});

export const sectionLabelWrap = style({
  alignItems: 'center',
  display: 'inline-flex',
  flexWrap: 'wrap',
  gap: 4,
  minWidth: 0,
});

export const sectionLabel = style({
  color: tokens.color.text.primary,
  fontSize: 12,
  margin: 0,
  selectors: {
    [`${sectionLink}:hover &`]: {
      color: tokens.color.text.accent,
    },
  },
});

export const sectionUpdatedAt = style({
  color: tokens.color.text.secondary,
  fontSize: 11,
  margin: 0,
  selectors: {
    [`${sectionLink}:hover &`]: {
      color: tokens.color.text.accent,
    },
  },
});

export const statusWithLabel = style({
  alignItems: 'center',
  display: 'inline-flex',
  flex: 'none',
  gap: 6,
});

export const statusText = style({
  color: tokens.color.text.primary,
  fontSize: 13,
  fontWeight: 400,
  margin: 0,
});

export const teamMine = style({
  background: tokens.color.accent,
  borderRadius: 999,
  color: tokens.color['on-accent'],
  fontSize: 12,
  fontWeight: 600,
  marginLeft: 4,
  padding: '2px 8px',
});

export const guide = style({
  color: tokens.color.text.secondary,
  fontSize: 11,
  fontWeight: 400,
  lineHeight: 1.5,
  margin: 0,
});

export const fileRow = style({
  alignItems: 'center',
  display: 'flex',
  gap: 12,
});

export const fileIcon = style({
  alignItems: 'center',
  background: tokens.color.background.blue,
  borderRadius: 8,
  color: tokens.color.text.accent,
  display: 'flex',
  flex: 'none',
  fontSize: 11,
  fontWeight: 600,
  height: 40,
  justifyContent: 'center',
  width: 40,
});

export const fileInfo = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  minWidth: 0,
});

export const fileName = style({
  color: tokens.color.text.primary,
  fontSize: 13,
  fontWeight: 500,
  margin: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export const fileMeta = style({
  color: tokens.color.text.secondary,
  fontSize: 11,
  margin: 0,
});
