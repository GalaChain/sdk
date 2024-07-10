export default {
  root: ({ context, props }) => ({
    class: [
      // Position and Shadows
      'absolute',
      'shadow-md',
      'p-fadein',
      // Spacing
      {
        'py-0 px-1':
          context?.right ||
          context?.left ||
          (!context?.right && !context?.left && !context?.top && !context?.bottom),
        'py-1 px-0': context?.top || context?.bottom
      }
    ]
  }),
  arrow: ({ context, props }) => ({
    class: [
      // Position

      'absolute',

      // Size
      'w-0',
      'h-0',

      // Shape
      'border-transparent',
      'border-solid',
      {
        'border-y-[0.25rem] border-r-[0.25rem] border-l-0 border-r-surface-300 dark:border-r-surface-800':
          context?.right ||
          (!context?.right && !context?.left && !context?.top && !context?.bottom),
        'border-y-[0.25rem] border-l-[0.25rem] border-r-0 border-l-surface-300 dark:border-l-surface-800':
          context?.left,
        'border-x-[0.25rem] border-t-[0.25rem] border-b-0 border-t-surface-300 dark:border-t-surface-800':
          context?.top,
        'border-x-[0.25rem] border-b-[0.25rem] border-t-0 border-b-surface-300 dark:border-b-surface-800':
          context?.bottom
      },

      // Spacing
      {
        '-mt-1 ':
          context?.right ||
          (!context?.right && !context?.left && !context?.top && !context?.bottom),
        '-mt-1': context?.left,
        '-ml-1': context?.top || context?.bottom
      }
    ]
  }),
  text: {
    class: [
      'tooltip-text',
      'text-surface-primary',
      // 'bg-surface-250 dark:bg-surface-850 ring-1 ring-inset ring-surface-300 dark:ring-surface-800',
      'p-3',
      'leading-none',
      // 'rounded-md',
      'text-sm'
      // 'whitespace-pre-line',
      // 'break-words',
    ]
  }
}
