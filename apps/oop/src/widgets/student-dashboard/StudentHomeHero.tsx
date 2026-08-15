import type {
  StudentHomeAnnouncement,
  StudentHomeHero as StudentHomeHeroData,
} from '@aics/core';
import { Button, Divider, EmptyState } from '@aics/design-system';
import { ArrowRight, Bell, ClipboardList, NotebookPen } from 'lucide-react';
import { type KeyboardEvent, useRef, useState } from 'react';

import { cx } from '~/shared/lib/cx';

import * as styles from './StudentHomeHero.css';

const SHORTCUT_TABS = [
  { id: 'notice', label: '공지사항', icon: Bell },
  { id: 'minutes', label: '회의록', icon: NotebookPen },
  { id: 'action-plan', label: '액션 플랜', icon: ClipboardList },
] as const;

type ShortcutTabId = (typeof SHORTCUT_TABS)[number]['id'];

type StudentHomeHeroProps = {
  hero: StudentHomeHeroData;
  announcements: StudentHomeAnnouncement[];
};

export default function StudentHomeHero({
  hero,
  announcements,
}: StudentHomeHeroProps) {
  const [activeTab, setActiveTab] = useState<ShortcutTabId>('notice');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectTab = (index: number) => {
    const tab = SHORTCUT_TABS[index];
    if (!tab) return;

    setActiveTab(tab.id);
    tabRefs.current[index]?.focus();
  };

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % SHORTCUT_TABS.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + SHORTCUT_TABS.length) % SHORTCUT_TABS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = SHORTCUT_TABS.length - 1;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    selectTab(nextIndex);
  };

  return (
    <section className={styles.hero}>
      <div className={styles.heroBody}>
        <div className={styles.heroCopy}>
          <p className={styles.heroDate}>{hero.date}</p>
          <h2 className={styles.heroHeading}>{hero.heading}</h2>
          <p className={styles.heroDesc}>{hero.description}</p>
          <div className={styles.heroSpacer} />
          <Button
            className={styles.cta}
            endContent={<ArrowRight aria-hidden='true' size={24} />}
            isDisabled
            label={hero.ctaLabel}
            size='lg'
            tooltip='단계별 이동은 후속 작업에서 제공돼요.'
            variant='primary'
          />
        </div>

        <div className={styles.shortcut}>
          <div
            aria-label='학생 홈 바로가기'
            className={styles.tabs}
            role='tablist'
          >
            {SHORTCUT_TABS.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  aria-controls={`shortcut-panel-${tab.id}`}
                  aria-selected={isActive}
                  className={cx(styles.tab, isActive ? styles.tabActive : '')}
                  id={`shortcut-tab-${tab.id}`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={event => handleTabKeyDown(event, index)}
                  ref={element => {
                    tabRefs.current[index] = element;
                  }}
                  role='tab'
                  tabIndex={isActive ? 0 : -1}
                  type='button'
                >
                  <Icon aria-hidden='true' size={36} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div
            aria-labelledby={`shortcut-tab-${activeTab}`}
            id={`shortcut-panel-${activeTab}`}
            role='tabpanel'
          >
            {activeTab === 'notice' ? (
              announcements.length > 0 ? (
                <div className={styles.noticeList}>
                  {announcements.map((announcement, index) => (
                    <div key={announcement.id}>
                      <div className={styles.notice}>
                        <p className={styles.noticeTitle}>
                          {announcement.title}
                        </p>
                        <div className={styles.noticeMeta}>
                          <p className={styles.noticeContent}>
                            {announcement.content}
                          </p>
                          <p className={styles.noticeDate}>
                            {announcement.date}
                          </p>
                        </div>
                      </div>
                      {index < announcements.length - 1 ? (
                        <Divider className={styles.divider} />
                      ) : null}
                    </div>
                  ))}
                  <Button
                    className={styles.more}
                    label='더보기'
                    size='sm'
                    variant='ghost'
                  />
                  {/* TODO(KD3-75 follow-up): 공지 목록 티켓에서 더보기 동작을 연결한다. */}
                </div>
              ) : (
                <EmptyState
                  className={styles.emptyTab}
                  description='새 공지가 등록되면 이곳에 표시돼요.'
                  isCompact
                  title='등록된 공지가 없어요.'
                />
              )
            ) : (
              <EmptyState
                className={styles.emptyTab}
                description={
                  activeTab === 'minutes'
                    ? '회의록을 작성하면 이곳에서 확인할 수 있어요.'
                    : '팀의 다음 할 일을 등록하면 이곳에서 확인할 수 있어요.'
                }
                isCompact
                title={
                  activeTab === 'minutes'
                    ? '아직 작성된 회의록이 없어요.'
                    : '아직 등록된 액션 플랜이 없어요.'
                }
              />
            )}
          </div>
        </div>
      </div>

      <div className={styles.meetingRow}>
        <Button
          className={styles.meetingCta}
          label='회의록 작성'
          size='lg'
          variant='primary'
        />
        {/* TODO(KD3-75 follow-up): 회의록 티켓에서 작성 화면으로 연결한다. */}
      </div>
    </section>
  );
}
