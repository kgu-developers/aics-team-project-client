import { AstryxThemeProvider } from '@aics/design-system';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SurveyShell } from './SurveyShell';
import * as styles from './SurveyShell.css';

describe('SurveyShell', () => {
  it('keeps standalone and embedded surfaces on separate responsive contracts', () => {
    render(
      <AstryxThemeProvider>
        <SurveyShell mode='standalone'>standalone content</SurveyShell>
        <SurveyShell mode='embedded' surfaceClassName='stable-surface'>
          embedded content
        </SurveyShell>
      </AstryxThemeProvider>,
    );

    const standaloneContent = screen.getByText('standalone content');
    const embeddedContent = screen.getByText('embedded content');
    const standaloneSurface = standaloneContent.closest(
      '[data-survey-shell-surface]',
    );
    const embeddedSurface = embeddedContent.closest(
      '[data-survey-shell-surface]',
    );

    expect(
      standaloneContent.closest('[data-survey-shell-mode]'),
    ).toHaveAttribute('data-survey-shell-mode', 'standalone');
    expect(embeddedContent.closest('[data-survey-shell-mode]')).toHaveAttribute(
      'data-survey-shell-mode',
      'embedded',
    );
    expect(standaloneSurface).toHaveClass(
      styles.surface,
      styles.standaloneSurface,
    );
    expect(standaloneSurface).not.toHaveClass(styles.embeddedSurface);
    expect(embeddedSurface).toHaveClass(styles.surface, styles.embeddedSurface);
    expect(embeddedSurface).toHaveClass('stable-surface');
    expect(embeddedSurface).not.toHaveClass(styles.standaloneSurface);
  });
});
