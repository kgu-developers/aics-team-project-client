import { tokens } from '@aics/design-system';
import { style } from '@vanilla-extract/css';

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: tokens.spacing['4'],
});

export const heading = style({
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing['3'],
  justifyContent: 'space-between',
});

export const description = style({ margin: 0 });

export const documentPreview = style({
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  minWidth: 0,
  overflow: 'hidden',
  '@media': {
    'screen and (min-width: 960px)': {
      gridTemplateColumns: '220px minmax(0, 1fr)',
    },
  },
});

export const sidebar = style({
  background: tokens.color.background.muted,
  display: 'grid',
  gap: tokens.spacing['3'],
  minWidth: 0,
  padding: tokens.spacing['4'],
});

export const sidebarHeader = style({
  display: 'grid',
  gap: tokens.spacing['1'],
});

export const mobileSelector = style({
  '@media': {
    'screen and (min-width: 960px)': { display: 'none' },
  },
});

export const desktopSections = style({
  display: 'none',
  gap: tokens.spacing['1'],
  '@media': {
    'screen and (min-width: 960px)': { display: 'grid' },
  },
});

export const sectionButton = style({
  background: 'transparent',
  border: 0,
  color: tokens.color.text.secondary,
  justifyContent: 'flex-start',
  minWidth: 0,
  padding: `${tokens.spacing['2']} ${tokens.spacing['3']}`,
  width: '100%',
  selectors: {
    '&:hover': { background: tokens.color.background.gray },
    '&:focus-visible': { outline: `2px solid ${tokens.color.accent}` },
  },
});

export const activeSectionButton = style({
  background: tokens.color.background.card,
  color: tokens.color.text.primary,
  fontWeight: tokens['font-weight'].semibold,
});

export const document = style({
  background: tokens.color.background.card,
  display: 'grid',
  gap: tokens.spacing['5'],
  minWidth: 0,
  padding: tokens.spacing['5'],
  '@media': {
    'screen and (max-width: 639px)': { padding: tokens.spacing['4'] },
  },
});

export const documentHeader = style({
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing['3'],
  justifyContent: 'space-between',
});

export const readOnlyNotice = style({
  background: tokens.color.background.muted,
  color: tokens.color.text.secondary,
  fontSize: tokens['font-size'].sm,
  padding: tokens.spacing['3'],
});

export const fieldList = style({
  display: 'grid',
  gap: tokens.spacing['4'],
});

export const documentActions = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing['2'],
});

export const teamInfo = style({
  display: 'grid',
  gap: tokens.spacing['3'],
  margin: 0,
});

export const teamInfoRow = style({
  borderBottom: `1px solid ${tokens.color.border.base}`,
  display: 'grid',
  gap: tokens.spacing['1'],
  paddingBottom: tokens.spacing['3'],
});

export const teamInfoLabel = style({
  color: tokens.color.text.secondary,
  fontSize: tokens['font-size'].sm,
});

export const teamInfoValue = style({ margin: 0 });

export const artifactPreview = style({
  display: 'grid',
  gap: tokens.spacing['4'],
});

export const submissionModalPreview = style({
  margin: '0 auto',
  maxWidth: '100%',
  width: 'min(640px, calc(100vw - 32px))',
});

export const artifactHeader = style({
  alignItems: 'flex-start',
  display: 'flex',
  flexWrap: 'wrap',
  gap: tokens.spacing['3'],
  justifyContent: 'space-between',
});

export const submissionPreviewForm = style({
  display: 'grid',
  gap: tokens.spacing['4'],
});

export const previewArtifactField = style({
  display: 'grid',
  gap: tokens.spacing['1'],
});

export const artifactMeta = style({
  color: tokens.color.text.secondary,
  margin: 0,
});
