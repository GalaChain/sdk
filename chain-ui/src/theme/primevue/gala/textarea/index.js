export default {
  root: ({ context }) => ({
    class: [
      // Font
      'font-sans leading-none',

      // Spacing
      'm-0',
      'p-3',

      // Shape
      'rounded-xl',

      // Colors
      'text-surface-primary',
      'placeholder:text-surface-secondary',
      'bg-surface-200 dark:bg-surface-850',
      'border-0 border-surface-200 dark:border-surface-850',

      // States
      {
        'focus:outline-none ring-1 ring-inset ring-transparent ring-opacity-50 focus-visible:focus-ring':
          !context.disabled,
        'opacity-60 select-none pointer-events-none cursor-default': context.disabled
      },

      // Misc
      'appearance-none',
      'transition-colors duration-200'
    ]
  })
}
