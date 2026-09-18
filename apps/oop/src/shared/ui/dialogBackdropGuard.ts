import { type PointerEvent, type SyntheticEvent, useRef } from 'react';

/**
 * The design-system `Dialog` (purpose `info`) closes when a `click` lands on
 * the `<dialog>` element itself, which is how a backdrop click looks. A drag
 * that starts inside the content and ends on the backdrop also produces that
 * `click` (browsers dispatch it on the common ancestor of pointerdown and
 * pointerup targets), so text selection could dismiss the dialog.
 *
 * Spread the returned props on `Dialog`: they run in the capture phase before
 * the dialog's own handler and swallow the click unless the pointer also went
 * down on the backdrop.
 */
export function useDialogBackdropDragGuard<T extends HTMLElement>() {
  const pointerDownOnBackdrop = useRef(false);

  return {
    onClickCapture(event: SyntheticEvent<T>) {
      const isBackdropTarget = event.target === event.currentTarget;
      const startedOnBackdrop = pointerDownOnBackdrop.current;
      pointerDownOnBackdrop.current = false;
      if (isBackdropTarget && !startedOnBackdrop) event.stopPropagation();
    },
    onPointerDownCapture(event: PointerEvent<T>) {
      pointerDownOnBackdrop.current = event.target === event.currentTarget;
    },
  };
}
