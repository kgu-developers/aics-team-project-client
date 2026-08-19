import { style } from '@vanilla-extract/css';

import { layoutTokens } from '~/app/tokens.css';

export const page = style({
  display: 'flex',
  flexDirection: 'column',
  gap: layoutTokens.page['section-gap'],
  margin: '0 auto',
  maxWidth: layoutTokens.workspace['content-width'],
  padding: `${layoutTokens.page['padding-y']} ${layoutTokens.page['padding-x']}`,
});
