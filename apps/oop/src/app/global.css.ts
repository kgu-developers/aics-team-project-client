import { tokens } from '@aics/design-system';
import { globalStyle } from '@vanilla-extract/css';

// 06 Desktop 레이아웃 토큰(:root vars)은 tokens.css.ts의 createGlobalTheme이 선언한다.
import './tokens.css.ts';

globalStyle(':root', {
  background: tokens.color.background.body,
});

globalStyle('*', {
  boxSizing: 'border-box',
});

globalStyle('body', {
  fontFamily: tokens['font-family'].body,
  margin: 0,
});
