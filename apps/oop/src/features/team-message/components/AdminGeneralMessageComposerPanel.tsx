import { Button, Heading, Text, TextArea } from '@aics/design-system';
import type { ReactNode } from 'react';

import * as styles from './AdminGeneralMessageDialog.css';
import { useDraggableMessagePanel } from './useDraggableMessagePanel';

type AdminGeneralMessageComposerPanelProps = {
  description: string;
  errorMessage: string | null;
  isSubmitDisabled: boolean;
  isSubmitPending: boolean;
  message: string;
  onClose: () => void;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  recipientSelectors: ReactNode;
  successMessage: string | null;
};

/** Shared movable message composer shell; each page supplies only its recipient controls. */
export function AdminGeneralMessageComposerPanel({
  description,
  errorMessage,
  isSubmitDisabled,
  isSubmitPending,
  message,
  onClose,
  onMessageChange,
  onSend,
  recipientSelectors,
  successMessage,
}: AdminGeneralMessageComposerPanelProps) {
  const draggablePanel = useDraggableMessagePanel();

  return (
    <aside
      aria-label='일반 메시지 작성 패널'
      className={styles.panel}
      onPointerDown={draggablePanel.handlePointerDown}
      onPointerMove={draggablePanel.handlePointerMove}
      onPointerUp={draggablePanel.handlePointerUp}
      ref={draggablePanel.panelRef}
      style={draggablePanel.panelStyle}
    >
      <div className={styles.content}>
        <div className={styles.panelHeader} data-panel-drag-handle>
          <Heading level={2}>일반 메시지 보내기</Heading>
          <Text color='secondary' type='supporting'>
            ⋮⋮ 이동
          </Text>
        </div>
        <Text color='secondary'>{description}</Text>
        {recipientSelectors}
        <TextArea
          aria-label='일반 메시지 내용'
          label='내용'
          onChange={onMessageChange}
          placeholder='팀에 전달할 메시지를 입력하세요.'
          value={message}
        />
        {successMessage ? <Text role='status'>{successMessage}</Text> : null}
        {errorMessage ? <Text role='alert'>{errorMessage}</Text> : null}
        <div className={styles.actions}>
          <Button
            isDisabled={isSubmitPending}
            label='닫기'
            onClick={onClose}
            variant='secondary'
          />
          <Button
            isDisabled={isSubmitDisabled}
            isLoading={isSubmitPending}
            label='보내기'
            onClick={onSend}
          />
        </div>
      </div>
    </aside>
  );
}
