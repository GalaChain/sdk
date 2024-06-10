export default {
  root: ({ props, context, parent }) => ({
    class: [
      // Font
      'font-sans font-semibold placeholder:font-normal',

      // Spacing
      'm-0',
      {
        'px-6 py-4': props.size == 'large',
        'px-4 py-2': props.size == 'small',
        'p-4': props.size == null,
      },

      // Shape
      { 'rounded-xl': parent.instance.$name !== 'InputGroup' },
      {
        'first:rounded-l-xl rounded-none last:rounded-r-xl':
          parent.instance.$name == 'InputGroup',
      },
      //   {
      //     'border-0 border-y border-l last:border-r':
      //       parent.instance.$name == 'InputGroup',
      //   },
      {
        'first:ml-0 ml-[-1px]':
          parent.instance.$name == 'InputGroup' && !props.showButtons,
      },

      // Colors
      'text-surface-primary',
      'placeholder:text-surface-secondary',
      'bg-surface-200 dark:bg-surface-850',
      'border-0 border-surface-200 dark:border-surface-850',

      // States
      {
        // 'hover:border-primary-500 dark:hover:border-primary-400': !context.disabled,
        'focus:outline-none ring-1 ring-inset ring-transparent ring-opacity-50 focus-visible:focus-ring':
          !context.disabled,
        'opacity-60 select-none pointer-events-none cursor-default':
          context.disabled,
      },

      // Misc
      'appearance-none',
      'transition-colors duration-200',
    ],
  }),
};
