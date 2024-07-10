export default {
  root: {
    class: [
      'relative',

      // Alignment
      'inline-flex',
      'align-bottom',

      // Misc
      'cursor-pointer',
      'select-none'
    ]
  },
  box: ({ props }) => ({
    class: [
      // Alignments
      'items-center inline-flex flex-1 text-center align-bottom justify-center',

      // Sizes & Spacing
      'px-4 py-3 leading-none',

      // Shapes
      'rounded-md border',

      // Colors
      {
        'bg-surface-0 dark:bg-surface-900 ': !props.modelValue,
        'border-surface-200 dark:border-surface-700 ': !props.modelValue,
        'text-surface-700 dark:text-white/80': !props.modelValue,
        'bg-primary-500 dark:bg-primary-400 border-primary-500 dark:border-primary-400 text-white dark:text-surface-900':
          props.modelValue
      },

      // States
      {
        'peer-hover:bg-surface-50 dark:peer-hover:bg-surface-800/80 peer-hover:border-surface-200 dark:peer-hover:bg-surface-700 peer-hover:text-surface-700 dark:peer-hover:text-white/80':
          !props.modelValue,
        'peer-hover:bg-primary-600 peer-hover:border-primary-600 dark:peer-hover:bg-primary-300 dark:peer-hover:border-primary-300':
          props.modelValue,
        'peer-focus-visible:ring peer-focus-visible:ring-primary-400/50 dark:peer-focus-visible:ring-primary-300/50':
          !props.disabled
      },

      // Transitions
      'transition-all duration-200',

      // Misc
      {
        'cursor-pointer': !props.disabled,
        'opacity-60 select-none pointer-events-none cursor-default': props.disabled
      }
    ]
  }),
  label: {
    class: 'font-bold text-center w-full empty:hidden'
  },
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
      'border border-surface-200 dark:border-surface-700',

      // Misc
      'appareance-none',
      'cursor-pointer'
    ]
  },
  icon: ({ props }) => ({
    class: [
      ' mr-2',
      {
        'text-surface-600 dark:text-white/70': !props.modelValue,
        'text-white dark:text-surface-900': props.modelValue
      }
    ]
  })
}
