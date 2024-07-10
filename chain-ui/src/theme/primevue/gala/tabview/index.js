export default {
  navContainer: ({ props }) => ({
    class: [
      // Position
      'relative',

      // Misc
      { 'overflow-hidden': props.scrollable }
    ]
  }),
  navContent: {
    class: [
      // Overflow and Scrolling
      'overflow-y-hidden overscroll-contain',
      'overscroll-auto',
      'scroll-smooth',
      '[&::-webkit-scrollbar]:hidden'
    ]
  },
  previousButton: {
    class: [
      // Flexbox and Alignment
      'flex items-center justify-center',

      // Position
      '!absolute',
      'top-0 left-0',
      'z-20',

      // Size and Shape
      'h-full w-12',
      'rounded-lg transition-colors',

      // Colors
      'text-surface-primary bg-surface-200 dark:bg-surface-850',
      // 'hover:text-surface-primary-inverted hover:bg-surface-1000 hover:dark:bg-surface-0',
      'focus-visible:focus-ring focus-visible:focus-ring-offset',
      // 'bg-surface-0 dark:bg-surface-800',
      // 'text-primary-500 dark:text-primary-400',
      'shadow-md'
    ]
  },
  nextButton: {
    class: [
      // Flexbox and Alignment
      'flex items-center justify-center',

      // Position
      '!absolute',
      'top-0 right-0',
      'z-20',

      // Size and Shape
      'h-full w-12',
      'rounded-lg transition-colors',

      // Colors
      // 'bg-surface-0 dark:bg-surface-800',
      // 'text-primary-500 dark:text-primary-400',
      'text-surface-primary bg-surface-200 dark:bg-surface-850',
      'focus-visible:focus-ring focus-visible:focus-ring-offset',
      'shadow-md'
    ]
  },
  nav: {
    class: [
      // Flexbox
      'flex flex-1',

      // Spacing
      'list-none',
      'p-0 m-0',

      // Colors
      'bg-transparent',
      // 'bg-surface-0 dark:bg-surface-800',
      //   'border-b-2 border-surface-200 dark:border-surface-700',
      'border-b-2 border-transparent dark:border-transparent',
      'text-surface-900 dark:text-surface-0/80'
    ]
  },
  tabpanel: {
    header: ({ props }) => ({
      class: [
        // Spacing
        'mr-0',

        // Misc
        {
          'opacity-60 cursor-default user-select-none select-none pointer-events-none':
            props?.disabled
        }
      ]
    }),
    headerAction: ({ parent, context }) => ({
      class: [
        'relative',

        // Font
        'font-bold',

        // Flexbox and Alignment
        'flex items-center',

        // Spacing
        'px-5 py-4',
        '-mb-[2px]',

        // Shape
        'border-b-2',
        'border-transparent',
        'rounded-t-md',

        // Colors and Conditions
        {
          //   'border-surface-200 dark:border-surface-700':
          //     parent.state.d_activeIndex !== context.index,
          //   'bg-surface-0 dark:bg-surface-800':
          //     parent.state.d_activeIndex !== context.index,
          'text-surface-secondary': parent.state.d_activeIndex !== context.index,

          //   'bg-surface-0 dark:bg-surface-800':
          //     parent.state.d_activeIndex === context.index,
          //   'border-primary-500 dark:border-primary-400':
          //     parent.state.d_activeIndex === context.index,
          'text-surface-1000 dark:text-surface-0': parent.state.d_activeIndex === context.index
        },

        // States
        // 'focus-visible:focus-ring',
        'focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:ring-2 focus-visible:ring-inset',
        'focus-visible:ring-surface-1000 dark:focus-visible:ring-surface-0',
        'focus-visible:text-surface-1000 dark:focus-visible:text-surface-0',
        {
          //   'hover:bg-surface-0 dark:hover:bg-surface-800/80':
          //     parent.state.d_activeIndex !== context.index,
          //   'hover:border-surface-400 dark:hover:border-primary-400':
          //     parent.state.d_activeIndex !== context.index,
          'hover:text-surface-1000 dark:hover:text-surface-0':
            parent.state.d_activeIndex !== context.index
        },

        // Transitions
        'transition-all duration-200',

        // Misc
        'cursor-pointer select-none text-decoration-none',
        'overflow-hidden',
        'user-select-none'
      ]
    }),
    headerTitle: {
      class: [
        // Text
        'leading-none',
        'whitespace-nowrap'
      ]
    },
    content: {
      class: [
        // Spacing
        'p-5',

        // Shape
        // 'rounded-b-md',

        // Colors
        // 'bg-surface-0 dark:bg-surface-800',
        // 'text-surface-700 dark:text-surface-0/80',
        'border-0'
      ]
    }
  }
}
