import { createFileRoute } from '@tanstack/react-router';

import { validateEditorReturnContext } from '~/features/editor/editorReturnContext';

export const Route = createFileRoute('/student/editor/proposal/$section')({
  validateSearch: search => ({
    returnTo: validateEditorReturnContext('proposal', search.returnTo),
  }),
});
