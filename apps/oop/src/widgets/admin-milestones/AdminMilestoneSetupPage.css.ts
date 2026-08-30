import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
  margin: '0 auto',
  maxWidth: 1240,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});

export const header = style({
  alignItems: 'flex-start',
  display: 'flex',
  justifyContent: 'space-between',
});

export const backLink = style({
  color: tokens.color.text.accent,
  fontSize: 13,
  textDecoration: 'none',
});

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const sectionTitle = style({ margin: 0 });

export const scheduleGrid = style({
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media': { '(max-width: 640px)': { gridTemplateColumns: '1fr' } },
});

export const sectionScheduleList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const sectionSchedule = style({
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 20,
});

export const scheduleField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const scheduleInputs = style({
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 0.72fr)',
  '@media': { '(max-width: 640px)': { gridTemplateColumns: '1fr' } },
});

export const preview = style({
  background: tokens.color.background.muted,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 20,
});

export const previewEyebrow = style({
  color: tokens.color.text.secondary,
  margin: 0,
});

export const previewTitle = style({
  margin: 0,
  overflowWrap: 'anywhere',
});

export const previewTemplate = style({ margin: 0 });

export const previewDescription = style({
  margin: 0,
  overflowWrap: 'anywhere',
  whiteSpace: 'pre-wrap',
});

export const previewBlocksTitle = style({ margin: 4 });

export const previewList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  margin: 0,
  padding: 0,
});

export const previewItem = style({
  alignItems: 'center',
  display: 'flex',
  gap: 10,
  minWidth: 0,
});

export const previewItemNumber = style({
  alignItems: 'center',
  background: tokens.color.background.muted,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: '50%',
  display: 'inline-flex',
  flex: '0 0 24px',
  height: 24,
  justifyContent: 'center',
  width: 24,
});

export const previewNote = style({
  borderTop: `1px solid ${tokens.color.border.base}`,
  margin: '8px 0 0',
  overflowWrap: 'anywhere',
  paddingTop: 12,
});

export const action = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'flex-end',
});

export const actionNote = style({
  color: tokens.color.text.secondary,
  flex: '1 1 320px',
  margin: 0,
});
