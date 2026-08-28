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
  alignItems: 'flex-start',
  display: 'flex',
  gap: 16,
  justifyContent: 'space-between',
});

export const backLink = style({
  color: tokens.color.text.accent,
  flex: '0 0 auto',
  fontSize: 13,
  textDecoration: 'none',
});

export const detailCard = style({
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

export const readOnlyGrid = style({
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media': { '(max-width: 640px)': { gridTemplateColumns: '1fr' } },
});

export const readOnlyField = style({
  background: tokens.color.background.muted,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.element,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 0,
  padding: 16,
});

export const readOnlyValue = style({
  overflowWrap: 'anywhere',
  whiteSpace: 'pre-wrap',
});

export const sectionSchedule = style({
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  padding: 20,
});

export const policyTitle = style({ margin: 0 });

export const policyList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  marginTop: 8,
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

export const previewEyebrow = style({ margin: 0 });

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

export const previewBlocksTitle = style({ margin: '4px 0 0' });

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
  overflowWrap: 'anywhere',
});

export const previewItemNumber = style({
  alignItems: 'center',
  background: tokens.color.background.muted,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.full,
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

export const summary = style({
  lineHeight: 1.6,
  margin: 0,
  whiteSpace: 'pre-line',
});

export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
});
