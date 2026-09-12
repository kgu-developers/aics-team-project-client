import {
  Heading,
  Selector,
  SelectorOption,
  StatusDot,
} from '@aics/design-system';
import { Link, useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import {
  editorSectionTo,
  type EditorDocId,
} from '~/app/constants/editorSections';

import { cx } from '~/shared/lib/cx';

import * as styles from './DocumentEditorLayout.css';

export type DocumentEditorSection = {
  slug: string;
  label: string;
  status?: { label: string; variant: 'accent' | 'neutral' | 'success' } | null;
};
type Props = {
  activeSlug: string;
  children: ReactNode;
  /** Editor document key used to build section routes, e.g. proposal. */
  docId: EditorDocId;
  heading: string;
  meta?: ReactNode;
  sections: DocumentEditorSection[];
  title: string;
};
/** One shell for every document editor: section navigation and section header. */
export default function DocumentEditorLayout({
  activeSlug,
  children,
  docId,
  heading,
  meta,
  sections,
  title,
}: Props) {
  const navigate = useNavigate();
  return (
    <div className={styles.layout}>
      <nav aria-label={`${title} 작성 영역`} className={styles.sidebar}>
        <Heading className={styles.sidebarTitle} level={1}>
          {title}
        </Heading>
        <div className={styles.mobileSections}>
          <Selector
            label={`${title} 작성 영역 선택`}
            onChange={value =>
              void navigate({ to: editorSectionTo(docId, value) })
            }
            options={sections.map(item => ({
              value: item.slug,
              label: item.label,
            }))}
            renderOption={option => {
              const status = sections.find(
                item => item.slug === option.value,
              )?.status;
              return (
                <SelectorOption
                  endContent={
                    status ? (
                      <StatusDot
                        label={status.label}
                        variant={status.variant}
                      />
                    ) : undefined
                  }
                  label={option.label ?? option.value}
                />
              );
            }}
            value={activeSlug}
            width='100%'
          />
        </div>
        <div className={styles.desktopSections}>
          {sections.map(item => (
            <Link
              aria-current={item.slug === activeSlug ? 'page' : undefined}
              className={cx(
                styles.sectionLink,
                item.slug === activeSlug ? styles.activeSectionLink : '',
              )}
              key={item.slug}
              to={editorSectionTo(docId, item.slug)}
            >
              <span>{item.label}</span>
              {item.status ? (
                <StatusDot
                  label={item.status.label}
                  variant={item.status.variant}
                />
              ) : null}
            </Link>
          ))}
        </div>
        <Link className={styles.homeLink} to='/student'>
          학생 홈으로
        </Link>
      </nav>
      <section className={styles.document}>
        <div className={styles.header}>
          <Heading level={2}>{heading}</Heading>
          {meta}
        </div>
        {children}
      </section>
    </div>
  );
}
