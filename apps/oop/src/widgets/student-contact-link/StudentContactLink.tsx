import { Button, Text } from '@aics/design-system';

import { getOpenChatUrl } from '~/shared/config/openChat';

import * as styles from './StudentContactLink.css';

export default function StudentContactLink() {
  const url = getOpenChatUrl();

  return (
    <div aria-label='수업 문의' className={styles.contact} role='group'>
      {url ? (
        <Button
          className={styles.link}
          href={url}
          label='문의하기'
          rel='noopener noreferrer'
          target='_blank'
          variant='ghost'
        />
      ) : (
        <Text
          aria-disabled='true'
          className={styles.disabledLink}
          color='secondary'
        >
          문의하기
        </Text>
      )}
    </div>
  );
}
