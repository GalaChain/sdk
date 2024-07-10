export default {
  root: {
    class: [
      'relative',

      // Alignment
      'inline-flex',
      'align-bottom',

      // Size
      'w-6',
      'h-6',

      // Misc
      'cursor-pointer',
      'select-none'
    ]
  },
  box: ({ props, context }) => ({
    class: [
      // Alignment
      'flex',
      'items-center',
      'justify-center',

      // Size
      'w-6',
      'h-6',

      // Shape
      'rounded-md',
      'border-2',

      // Colors
      {
        'border-surface-500 bg-surface-100 dark:border-surface-600 dark:bg-surface-900':
          !context.checked,
        'border-primary-500 bg-primary-500 dark:border-primary-500 dark:bg-primary-500':
          context.checked
      },

      // States
      {
        'peer-hover:border-primary-500 dark:peer-hover:border-primary-500':
          !props.disabled && !context.checked,
        'peer-hover:bg-primary-700 dark:peer-hover:bg-primary-300 peer-hover:border-primary-700 dark:peer-hover:border-primary-300':
          !props.disabled && context.checked,
        'peer-focus-visible:focus-ring peer-focus-visible:focus-ring-offset': !props.disabled,
        'cursor-default opacity-60': props.disabled
      },
      'peer-invalid:border-error-500/50 peer-invalid:bg-gradient-to-r peer-invalid:from-transparent peer-invalid:to-error-500/30',

      // Transitions
      'transition-colors',
      'duration-200'
    ]
  }),
  input: {
    class: [
      'peer',

      // Size
      'w-full ',
      'h-full',

      // Position
      'absolute',
      'top-0 left-0',
      'z-10',

      // Spacing
      'p-0',
      'm-0',

      // Shape
      'opacity-0',
      'rounded-md',
      'outline-none',
      'border-2 border-surface-200 dark:border-surface-700',

      // Misc
      'appareance-none',
      'cursor-pointer'
    ]
  },
  icon: {
    class: [
      // Font
      'text-base leading-none',

      // Size
      'w-4',
      'h-4',

      // Colors
      'text-white dark:text-surface-900',

      // Transitions
      'transition-all',
      'duration-200'
    ]
  }
}
