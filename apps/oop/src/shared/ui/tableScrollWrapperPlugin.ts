import type { TableProps } from '@aics/design-system';

type TableScrollWrapperPlugin = Pick<
  NonNullable<TableProps<Record<string, unknown>>['plugins']>[string],
  'transformScrollWrapper'
>;

export const tableScrollWrapperPlugin: TableScrollWrapperPlugin = {
  transformScrollWrapper: props => ({
    ...props,
    htmlProps: {
      ...props.htmlProps,
      'data-aics-table-scroll-wrapper': '',
      style: {
        ...props.htmlProps.style,
        height: 'auto',
        marginBlock: 0,
        marginInline: 0,
        maxWidth: '100%',
        minHeight: 0,
        width: '100%',
      },
    },
  }),
};
