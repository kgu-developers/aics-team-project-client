import { Card, Text } from '@aics/design-system';
import type { ReactNode } from 'react';

import * as styles from './SurveyShell.css';

type SurveyShellProps = {
  children: ReactNode;
  eyebrow?: string;
  mode?: 'embedded' | 'standalone';
  surfaceClassName?: string;
};

export function SurveyShell({
  children,
  eyebrow,
  mode = 'embedded',
  surfaceClassName = '',
}: SurveyShellProps) {
  return (
    <div
      className={`${styles.shell} ${mode === 'standalone' ? styles.standaloneShell : styles.embeddedShell}`}
      data-survey-shell-mode={mode}
    >
      {eyebrow ? (
        <Text as='p' className={styles.eyebrow} type='large' weight='bold'>
          {eyebrow}
        </Text>
      ) : null}
      <Card
        className={`${styles.surface} ${mode === 'standalone' ? styles.standaloneSurface : styles.embeddedSurface} ${surfaceClassName}`}
        data-survey-shell-surface={mode}
        padding={0}
      >
        <div
          className={`${styles.content} ${mode === 'embedded' ? styles.embeddedContent : ''}`}
        >
          {children}
        </div>
      </Card>
    </div>
  );
}
