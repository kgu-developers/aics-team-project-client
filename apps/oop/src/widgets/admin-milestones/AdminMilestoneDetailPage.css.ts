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

export const titleContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 0,
});

export const pageTitle = style({
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
});

export const backLink = style({
  color: tokens.color.text.accent,
  flex: '0 0 auto',
  fontSize: 13,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});

export const detailStack = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  minWidth: 0,
});

export const section = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

export const sectionTitle = style({ margin: 0 });

export const basicGrid = style({
  display: 'grid',
  gap: 20,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media': {
    '(max-width: 760px)': { gridTemplateColumns: '1fr' },
  },
});

export const fullWidthField = style({ gridColumn: '1 / -1' });

export const scheduleGrid = style({
  display: 'grid',
  gap: 20,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media': {
    '(max-width: 760px)': { gridTemplateColumns: '1fr' },
  },
});

export const scheduleInputs = style({
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(150px, 0.8fr)',
  '@media': {
    '(max-width: 620px)': { gridTemplateColumns: '1fr' },
  },
});

export const sectionSchedule = style({
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  padding: 20,
});

export const policyGroup = style({
  borderTop: `1px solid ${tokens.color.border.base}`,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  paddingTop: 16,
});

export const artifactList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const artifact = style({
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.container,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: 16,
});

export const artifactContent = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  minWidth: 0,
});

export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
});

export const actionCard = style({
  position: 'static',
});

export const evaluationWindow = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'space-between',
});
