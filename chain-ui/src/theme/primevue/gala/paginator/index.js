export default {
  root: {
    class: [
      // Flex & Alignment
      'flex items-center justify-center flex-wrap',

      // Spacing
      'px-4 py-2',

      // Shape
      'border-0',

      // Color
      'text-surface-secondary'
    ]
  },
  firstpagebutton: ({ context }) => ({
    class: [
      'relative',

      // Flex & Alignment
      'inline-flex items-center justify-center',

      // Shape
      'border-0 rounded-full dark:rounded-md',

      // Size
      'min-w-[2rem] h-8 m-1.5',
      'leading-none',

      // Color
      'text-surface-secondary',
      // 'text-surface-500 dark:text-white/60',
      // hover:bg-surface-50 dark:hover:bg-surface-700/70

      // State
      {
        'bg-surface-200 dark:bg-surface-850 hover:text-surface-primary': !context.disabled,
        'focus:outline-none focus:outline-offset-0 focus-visible:ring-2 focus-visible:ring-surface-1000 dark:focus-visible:ring-surface-0':
          !context.disabled
      },

      // Transition
      'transition duration-200',

      // Misc
      'user-none overflow-hidden',
      { 'cursor-default pointer-events-none opacity-60': context.disabled }
    ]
  }),
  previouspagebutton: ({ context }) => ({
    class: [
      'relative',

      // Flex & Alignment
      'inline-flex items-center justify-center',

      // Shape
      'border-0 rounded-full dark:rounded-md',

      // Size
      'min-w-[2rem] h-8 m-1.5',
      'leading-none',

      // Color
      'text-surface-secondary',
      // 'text-surface-500 dark:text-white/60',

      // State
      {
        'bg-surface-200 dark:bg-surface-850 hover:text-surface-primary': !context.disabled,
        'focus:outline-none focus:outline-offset-0 focus-visible:ring-2 focus-visible:ring-surface-1000 dark:focus-visible:ring-surface-0':
          !context.disabled
      },

      // Transition
      'transition duration-200',

      // Misc
      'user-none overflow-hidden',
      { 'cursor-default pointer-events-none opacity-60': context.disabled }
    ]
  }),
  nextpagebutton: ({ context }) => ({
    class: [
      'relative',

      // Flex & Alignment
      'inline-flex items-center justify-center',

      // Shape
      'border-0 rounded-full dark:rounded-md',

      // Size
      'min-w-[2rem] h-8 m-1.5',
      'leading-none',

      // Color
      'text-surface-secondary',
      // 'text-surface-500 dark:text-white/60',

      // State
      {
        'bg-surface-200 dark:bg-surface-850 hover:text-surface-primary': !context.disabled,
        'focus:outline-none focus:outline-offset-0 focus-visible:ring-2 focus-visible:ring-surface-1000 dark:focus-visible:ring-surface-0':
          !context.disabled
      },

      // Transition
      'transition duration-200',

      // Misc
      'user-none overflow-hidden',
      { 'cursor-default pointer-events-none opacity-60': context.disabled }
    ]
  }),
  lastpagebutton: ({ context }) => ({
    class: [
      'relative',

      // Flex & Alignment
      'inline-flex items-center justify-center',

      // Shape
      'border-0 rounded-full dark:rounded-md',

      // Size
      'min-w-[2rem] h-8 m-1.5',
      'leading-none',

      // Color
      // 'text-surface-500 dark:text-white/60',
      'text-surface-secondary',

      // State
      {
        'bg-surface-200 dark:bg-surface-850 hover:text-surface-primary': !context.disabled,
        'focus:outline-none focus:outline-offset-0 focus-visible:ring-2 focus-visible:ring-surface-1000 dark:focus-visible:ring-surface-0':
          !context.disabled
      },

      // Transition
      'transition duration-200',

      // Misc
      'user-none overflow-hidden',
      { 'cursor-default pointer-events-none opacity-60': context.disabled }
    ]
  }),
  pagebutton: ({ context }) => ({
    class: [
      'relative font-semibold',

      // Flex & Alignment
      'inline-flex items-center justify-center',

      // Shape
      'border-0 rounded-full dark:rounded-md',

      // Size
      'min-w-[2rem] h-8 m-1.5',
      'leading-none',

      // Color
      {
        'text-surface-secondary': !context.active,
        'text-surface-primary': context.active
      },

      // State
      {
        'hover:bg-surface-200 hover:dark:bg-surface-850 hover:text-surface-primary':
          !context.disabled && !context.active,
        'focus:outline-none focus:outline-offset-0 focus:ring-2 focus:ring-surface-1000 dark:focus:ring-surface-0':
          !context.disabled
      },

      // Transition
      'transition duration-200',

      // Misc
      'user-none overflow-hidden',
      { 'cursor-default pointer-events-none opacity-60': context.disabled }
    ]
  }),
  rowperpagedropdown: {
    root: ({ props, state }) => ({
      class: [
        // Display and Position
        'inline-flex',
        'relative',

        // Shape
        'h-12',
        'rounded-md',

        // Spacing
        'mx-2',

        // Color and Background
        'bg-surface-0 dark:bg-surface-900',
        'border border-surface-300 dark:border-surface-700',

        // Transitions
        'transition-all',
        'duration-200',

        // States
        'hover:border-primary-500 dark:hover:border-primary-300',
        {
          'focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50':
            !state.focused
        },

        // Misc
        'cursor-pointer',
        'select-none',
        {
          'opacity-60': props.disabled,
          'pointer-events-none': props.disabled,
          'cursor-default': props.disabled
        }
      ]
    }),
    input: {
      class: [
        // Font
        'font-sans',
        'leading-5',

        // Display
        'block',
        'flex-auto',

        // Color and Background
        'bg-transparent',
        'border-0',
        'text-surface-800 dark:text-white/80',

        // Sizing and Spacing
        'w-[1%]',
        'p-3 pr-0',

        // Shape
        'rounded-none',

        // Transitions
        'transition',
        'duration-200',

        // States
        'focus:outline-none focus:shadow-none',

        // Misc
        'relative',
        'cursor-pointer',
        'overflow-hidden overflow-ellipsis',
        'whitespace-nowrap',
        'appearance-none'
      ]
    },
    trigger: {
      class: [
        // Flexbox
        'flex items-center justify-center',
        'shrink-0',

        // Color and Background
        'bg-transparent',
        'text-surface-500',

        // Size
        'w-12',

        // Shape
        'rounded-tr-md',
        'rounded-br-md'
      ]
    },
    panel: {
      class: [
        // Position
        'absolute top-0 left-0',

        // Shape
        'border-0 dark:border',
        'rounded-md',
        'shadow-md',

        // Color
        'text-surface-800 dark:text-white/80',
        'dark:border-surface-700'
      ]
    },
    wrapper: {
      class: [
        // Sizing
        'max-h-[200px]',

        // Misc
        'overflow-auto'
      ]
    },
    list: {
      class: 'py-3 list-none m-0'
    },
    item: ({ context }) => ({
      class: [
        // Font
        'font-normal',
        'leading-none',

        // Position
        'relative',

        // Shape
        'border-0',
        'rounded-none',

        // Spacing
        'm-0',
        'py-3 px-5',

        // Color
        {
          'text-surface-700 dark:text-white/80': !context.focused && !context.selected
        },
        {
          'bg-surface-50 dark:bg-surface-600/60 text-surface-700 dark:text-white/80':
            context.focused && !context.selected
        },
        {
          'bg-primary-100 dark:bg-primary-400/40 text-primary-700 dark:text-white/80':
            context.focused && context.selected
        },
        {
          'bg-primary-50 dark:bg-primary-400/40 text-primary-700 dark:text-white/80':
            !context.focused && context.selected
        },

        // States
        {
          'hover:bg-surface-100 dark:hover:bg-surface-600/80': !context.focused && !context.selected
        },
        {
          'hover:text-surface-700 hover:bg-surface-100 dark:hover:text-white dark:hover:bg-surface-600/80':
            context.focused && !context.selected
        },

        // Transitions
        'transition-shadow',
        'duration-200',

        // Misc
        'cursor-pointer',
        'overflow-hidden',
        'whitespace-nowrap'
      ]
    })
  },
  jumptopageinput: {
    root: {
      class: 'inline-flex mx-2'
    },
    input: {
      root: {
        class: [
          'relative',

          // Font
          'font-sans',
          'leading-none',

          // Display
          'block',
          'flex-auto',

          // Colors
          'text-surface-600 dark:text-surface-200',
          'placeholder:text-surface-400 dark:placeholder:text-surface-500',
          'bg-surface-0 dark:bg-surface-900',
          'border border-surface-300 dark:border-surface-600',

          // Sizing and Spacing
          'w-[1%] max-w-[3rem]',
          'p-3 m-0',

          // Shape
          'rounded-md',

          // Transitions
          'transition',
          'duration-200',

          // States
          'hover:border-primary-500 dark:hover:border-primary-400',
          'focus:outline-none focus:shadow-none',
          'focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-500/50 dark:focus:ring-primary-400/50',

          // Misc
          'cursor-pointer',
          'overflow-hidden overflow-ellipsis',
          'whitespace-nowrap',
          'appearance-none'
        ]
      }
    }
  },
  jumptopagedropdown: {
    root: ({ props, state }) => ({
      class: [
        // Display and Position
        'inline-flex',
        'relative',

        // Shape
        'h-12',
        'rounded-md',

        // Color and Background
        'bg-surface-0 dark:bg-surface-900',
        'border border-surface-300 dark:border-surface-700',

        // Transitions
        'transition-all',
        'duration-200',

        // States
        'hover:border-primary-500 dark:hover:border-primary-300',
        {
          'focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50':
            !state.focused
        },

        // Misc
        'cursor-pointer',
        'select-none',
        {
          'opacity-60': props.disabled,
          'pointer-events-none': props.disabled,
          'cursor-default': props.disabled
        }
      ]
    }),
    input: {
      class: [
        // Font
        'font-sans',
        'leading-none',

        // Display
        'block',
        'flex-auto',

        // Color and Background
        'bg-transparent',
        'border-0',
        'text-surface-800 dark:text-white/80',

        // Sizing and Spacing
        'w-[1%]',
        'p-3',

        // Shape
        'rounded-none',

        // Transitions
        'transition',
        'duration-200',

        // States
        'focus:outline-none focus:shadow-none',

        // Misc
        'relative',
        'cursor-pointer',
        'overflow-hidden overflow-ellipsis',
        'whitespace-nowrap',
        'appearance-none'
      ]
    },
    trigger: {
      class: [
        // Flexbox
        'flex items-center justify-center',
        'shrink-0',

        // Color and Background
        'bg-transparent',
        'text-surface-500',

        // Size
        'w-12',

        // Shape
        'rounded-tr-md',
        'rounded-br-md'
      ]
    },
    panel: {
      class: [
        // Position
        'absolute top-0 left-0',

        // Shape
        'border-0 dark:border',
        'rounded-md',
        'shadow-md',

        // Color
        'text-surface-800 dark:text-white/80',
        'dark:border-surface-700'
      ]
    },
    wrapper: {
      class: [
        // Sizing
        'max-h-[200px]',

        // Misc
        'overflow-auto'
      ]
    },
    list: {
      class: 'py-3 list-none m-0'
    },
    item: ({ context }) => ({
      class: [
        // Font
        'font-normal',
        'leading-none',

        // Position
        'relative',

        // Shape
        'border-0',
        'rounded-none',

        // Spacing
        'm-0',
        'py-3 px-5',

        // Color
        {
          'text-surface-700 dark:text-white/80': !context.focused && !context.selected
        },
        {
          'bg-surface-50 dark:bg-surface-600/60 text-surface-700 dark:text-white/80':
            context.focused && !context.selected
        },
        {
          'bg-primary-100 dark:bg-primary-400/40 text-primary-700 dark:text-white/80':
            context.focused && context.selected
        },
        {
          'bg-primary-50 dark:bg-primary-400/40 text-primary-700 dark:text-white/80':
            !context.focused && context.selected
        },

        // States
        {
          'hover:bg-surface-100 dark:hover:bg-surface-600/80': !context.focused && !context.selected
        },
        {
          'hover:text-surface-700 hover:bg-surface-100 dark:hover:text-white dark:hover:bg-surface-600/80':
            context.focused && !context.selected
        },

        // Transitions
        'transition-shadow',
        'duration-200',

        // Misc
        'cursor-pointer',
        'overflow-hidden',
        'whitespace-nowrap'
      ]
    })
  }
}
