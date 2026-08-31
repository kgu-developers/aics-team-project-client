import { tokens } from '@aics/design-system';
import { globalStyle, style } from '@vanilla-extract/css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
  margin: '0 auto',
  maxWidth: 1160,
  padding: '28px clamp(20px, 5vw, 48px) 56px',
  width: '100%',
});

export const profileCard = style({
  width: '100%',
});

export const uploadSection = style({
  width: '100%',
});

export const sectionHeader = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
});

export const profileForm = style({
  display: 'grid',
  gap: 16,
  gridTemplateColumns: '1fr',
});

export const introductionForm = style({
  display: 'grid',
  gap: 16,
});

export const actions = style({
  display: 'flex',
  justifyContent: 'flex-end',
});

export const passwordForm = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['3'],
});

export const passwordTitle = style({
  margin: 0,
});

export const passwordDescription = style({
  margin: 0,
});

export const passwordActions = style({
  display: 'flex',
  gap: tokens.spacing['2'],
  justifyContent: 'flex-end',
  paddingBlockStart: tokens.spacing['1'],
});

export const passwordError = style({
  color: tokens.color.text.red,
  margin: 0,
});

export const sectionSelect = style({
  border: `1px solid ${tokens.color.border.base}`,
  borderRadius: tokens.radius.element,
  font: 'inherit',
  marginTop: 6,
  minHeight: 40,
  padding: '8px 12px',
  width: '100%',
});

export const fieldLabel = style({
  display: 'block',
  marginBottom: 6,
});

export const introductionPreview = style({
  background: tokens.color.background.gray,
  borderRadius: tokens.radius.element,
  minHeight: 96,
  padding: 12,
  whiteSpace: 'pre-wrap',
});

export const uploadGrid = style({
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const uploadCard = style({
  minWidth: 0,
});

export const sectionStatusList = style({
  display: 'grid',
  gap: 8,
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  listStyle: 'none',
  margin: '12px 0 0',
  padding: 0,
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

export const statusGroups = style({
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  '@media': {
    '(max-width: 720px)': {
      gridTemplateColumns: '1fr',
    },
  },
});

globalStyle(`${sectionStatusList} li`, {
  alignItems: 'center',
  background: tokens.color.background.gray,
  borderRadius: tokens.radius.element,
  display: 'flex',
  fontSize: 13,
  gap: 8,
  justifyContent: 'space-between',
  padding: '10px 12px',
});

globalStyle(`${sectionStatusList} span`, {
  color: tokens.color.text.secondary,
});
