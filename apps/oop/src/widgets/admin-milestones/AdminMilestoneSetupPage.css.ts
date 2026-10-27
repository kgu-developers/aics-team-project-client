import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

import { layoutTokens } from '~/app/tokens.css';

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
  textDecoration: 'underline',
  textUnderlineOffset: 3,
});

export const form = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  paddingBottom: `calc(${layoutTokens.workspace['savebar-height']} + 24px)`,
});

export const layout = style({
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'minmax(0, 1fr)',
  minWidth: 0,
});

export const settingsColumn = style({
  display: 'grid',
  gap: 16,
  minWidth: 0,
});

export const previewColumn = style({
  minWidth: 0,
});

export const previewCard = style({
  minWidth: 0,
});

export const actionCard = style({
  boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.06)',
  maxWidth: 'calc(1240px - clamp(20px, 5vw, 48px) - clamp(20px, 5vw, 48px))',
  pointerEvents: 'auto',
  width: '100%',
});

export const actionDock = style({
  bottom: 16,
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'center',
  left: layoutTokens.workspace['sidebar-width'],
  paddingInline: 'clamp(20px, 5vw, 48px)',
  pointerEvents: 'none',
  position: 'fixed',
  right: 0,
  zIndex: 10,
});

export const actionFeedback = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
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
  '@media': { '(max-width: 760px)': { gridTemplateColumns: '1fr' } },
});

export const fieldGroup = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  minWidth: 0,
});

export const fullWidthField = style({
  gridColumn: '1 / -1',
});

export const scheduleGrid = style({
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  // Each schedule group contains a date and a time control. Stack groups
  // before either inner control becomes too narrow or its label overlaps.
  '@media': { '(max-width: 1200px)': { gridTemplateColumns: '1fr' } },
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
  gridTemplateColumns: 'minmax(220px, 1.4fr) minmax(150px, 0.8fr)',
  '@media': { '(max-width: 620px)': { gridTemplateColumns: '1fr' } },
});

export const timeField = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

export const quickTimeActions = style({
  alignItems: 'center',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
});

export const quickTimeButtons = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4,
});

export const timeInput = style({
  appearance: 'none',
  background: tokens.color.background.surface,
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.element,
  boxSizing: 'border-box',
  color: tokens.color.text.primary,
  font: 'inherit',
  minHeight: 40,
  padding: '8px 12px',
  width: '100%',
});

export const action = style({
  alignItems: 'center',
  boxSizing: 'border-box',
  display: 'flex',
  flexWrap: 'wrap',
  gap: 12,
  justifyContent: 'flex-end',
  margin: '0 auto',
  maxWidth: 1240,
  width: '100%',
});

export const actionNote = style({
  color: tokens.color.text.secondary,
  margin: 0,
});

export const formError = style({
  color: tokens.color.text.red,
  margin: 0,
});

export const resultList = style({
  margin: 0,
  paddingLeft: 20,
});
