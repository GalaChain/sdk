export default {
  root: ({ props }) => ({
    class: [
      'pw-root inline-flex relative',
      {
        'opacity-60 select-none pointer-events-none cursor-default': props.disabled
      }
    ]
  }),
  panel: {
    class: [
      'text-base',

      // Spacing
      'p-5',

      // Shape
      // 'border border-surface-200 dark:border-surface-850',
      'border-0',
      'shadow-lg rounded-xl',

      // Colors
      'bg-surface-200 dark:bg-surface-850',
      'text-surface-secondary',
      'ring-1 ring-surface-1000/10 dark:ring-surface-0/10 focus:outline-none'
    ]
  },
  meter: {
    class: [
      // Position and Overflow
      'overflow-hidden',
      'relative',

      // Shape and Size
      'rounded-2xl',
      'border-0',
      'h-3',

      // Spacing
      'mb-2',

      // Colors
      'bg-surface-100 dark:bg-surface-700'
    ]
  },
  meterlabel: ({ instance }) => ({
    class: [
      // Size
      'h-full',

      // Colors
      {
        'bg-red-500 dark:bg-red-400/50': instance?.meter?.strength == 'weak',
        'bg-orange-500 dark:bg-orange-400/50': instance?.meter?.strength == 'medium',
        'bg-green-500 dark:bg-green-400/50': instance?.meter?.strength == 'strong'
      },

      // Transitions
      'transition-all duration-1000 ease-in-out'
    ]
  }),
  showicon: {
    class: ['absolute top-1/2 right-3 -mt-2', 'text-surface-600 dark:text-white/70']
  },
  hideicon: {
    class: ['absolute top-1/2 right-3 -mt-2', 'text-surface-600 dark:text-white/70']
  },
  transition: {
    enterFromClass: 'opacity-0 scale-y-[0.8]',
    enterActiveClass:
      'transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]',
    leaveActiveClass: 'transition-opacity duration-100 ease-linear',
    leaveToClass: 'opacity-0'
  }
}
