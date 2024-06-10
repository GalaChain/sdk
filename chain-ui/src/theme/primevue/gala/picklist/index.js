export default {
    root: {
        class: [
            // Flexbox
            'flex lg:flex-row flex-col'
        ]
    },
    sourcecontrols: {
        class: [
            // Flexbox & Alignment
            'flex lg:flex-col justify-center gap-2',

            // Spacing
            'p-5'
        ]
    },
    sourcemoveupbutton: {
        root: ({ context }) => ({
            class: [
                // Flexbox & Alignment
                'relative inline-flex items-center justify-center',

                // Shape
                'rounded-md',

                // Color
                'text-white dark:text-surface-900',
                'bg-primary-500 dark:bg-primary-400',
                'border border-primary-500 dark:border-primary-400',

                // Spacing & Size
                'w-12',
                'm-0',
                'px-0 py-3',

                // Transitions
                'transition duration-200 ease-in-out',

                // State
                'hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300',
                'focus:outline-none focus:outline-offset-0 focus:ring',
                'focus:ring-primary-400/50 dark:focus:ring-primary-300/50',
                { 'cursor-default pointer-events-none opacity-60': context.disabled },

                // Interactivity
                'cursor-pointer user-select-none'
            ]
        }),
        label: {
            class: [
                // Flexbox
                'flex-initial',

                // Size
                'w-0'
            ]
        }
    },
    sourcemovetopbutton: {
        root: ({ context }) => ({
            class: [
                // Flexbox & Alignment
                'relative inline-flex items-center justify-center',

                // Shape
                'rounded-md',

                // Color
                'text-white dark:text-surface-900',
                'bg-primary-500 dark:bg-primary-400',
                'border border-primary-500 dark:border-primary-400',

                // Spacing & Size
                'w-12',
                'm-0',
                'px-0 py-3',

                // Transitions
                'transition duration-200 ease-in-out',

                // State
                'hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300',
                'focus:outline-none focus:outline-offset-0 focus:ring',
                'focus:ring-primary-400/50 dark:focus:ring-primary-300/50',
                { 'cursor-default pointer-events-none opacity-60': context.disabled },

                // Interactivity
                'cursor-pointer user-select-none'
            ]
        }),
        label: {
            class: [
                // Flexbox
                'flex-initial',

                // Size
                'w-0'
            ]
        }
    },
    sourcemovedownbutton: {
        root: ({ context }) => ({
            class: [
                // Flexbox & Alignment
                'relative inline-flex items-center justify-center',

                // Shape
                'rounded-md',

                // Color
                'text-white dark:text-surface-900',
                'bg-primary-500 dark:bg-primary-400',
                'border border-primary-500 dark:border-primary-400',

                // Spacing & Size
                'w-12',
                'm-0',
                'px-0 py-3',

                // Transitions
                'transition duration-200 ease-in-out',

                // State
                'hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300',
                'focus:outline-none focus:outline-offset-0 focus:ring',
                'focus:ring-primary-400/50 dark:focus:ring-primary-300/50',
                { 'cursor-default pointer-events-none opacity-60': context.disabled },

                // Interactivity
                'cursor-pointer user-select-none'
            ]
        }),
        label: {
            class: [
                // Flexbox
                'flex-initial',

                // Size
                'w-0'
            ]
        }
    },
    sourcemovebottombutton: {
        root: ({ context }) => ({
            class: [
                // Flexbox & Alignment
                'relative inline-flex items-center justify-center',

                // Shape
                'rounded-md',

                // Color
                'text-white dark:text-surface-900',
                'bg-primary-500 dark:bg-primary-400',
                'border border-primary-500 dark:border-primary-400',

                // Spacing & Size
                'w-12',
                'm-0',
                'px-0 py-3',

                // Transitions
                'transition duration-200 ease-in-out',

                // State
                'hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300',
                'focus:outline-none focus:outline-offset-0 focus:ring',
                'focus:ring-primary-400/50 dark:focus:ring-primary-300/50',
                { 'cursor-default pointer-events-none opacity-60': context.disabled },

                // Interactivity
                'cursor-pointer user-select-none'
            ]
        }),
        label: {
            class: [
                // Flexbox
                'flex-initial',

                // Size
                'w-0'
            ]
        }
    },
    sourcewrapper: {
        class: 'grow shrink basis-2/4'
    },
    sourceheader: {
        class: [
            'font-bold',

            // Shape
            'border-b-0 rounded-t-md',

            // Spacing
            'p-5',

            // Color
            'text-surface-700 dark:text-white/80',
            'bg-surface-50 dark:bg-surface-800',
            'border border-surface-200 dark:border-surface-700'
        ]
    },
    sourcelist: {
        class: [
            // Spacing
            'list-none m-0 p-0',

            // Size
            'min-h-[12rem] max-h-[24rem]',

            // Shape
            'rounded-b-md',

            // Color
            'text-surface-600 dark:text-white/80',
            'bg-surface-0 dark:bg-surface-800',
            'border border-surface-200 dark:border-surface-700',

            // Spacing
            'py-3 px-0',

            // Focus & Outline
            'outline-none',

            // Misc
            'overflow-auto'
        ]
    },
    item: ({ context }) => ({
        class: [
            // Position
            'relative',

            // Spacing
            'py-3 px-5 m-0',

            // Shape
            'border-none',

            // Transition
            'transition duration-200',

            // Color
            'text-surface-700 dark:text-white/80',
            { 'bg-primary-500/20 dark:bg-primary-300/20': context.active && !context.focused },
            { 'bg-primary-500/30 dark:bg-primary-400/30': context.active && context.focused },
            { 'bg-surface-100 dark:bg-surface-700/70': !context.active && context.focused },

            // State
            'hover:bg-surface-100 dark:hover:bg-surface-700',

            // Misc
            'cursor-pointer overflow-hidden'
        ]
    }),
    buttons: {
        class: 'flex lg:flex-col justify-center gap-2 p-5'
    },
    movetotargetbutton: {
        root: ({ context }) => ({
            class: [
                // Flexbox & Alignment
                'relative inline-flex items-center justify-center',

                // Shape
                'rounded-md',

                // Color
                'text-white dark:text-surface-900',
                'bg-primary-500 dark:bg-primary-400',
                'border border-primary-500 dark:border-primary-400',

                // Spacing & Size
                'w-12',
                'm-0',
                'px-0 py-3',

                // Transitions
                'transition duration-200 ease-in-out',

                // State
                'hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300',
                'focus:outline-none focus:outline-offset-0 focus:ring',
                'focus:ring-primary-400/50 dark:focus:ring-primary-300/50',
                { 'cursor-default pointer-events-none opacity-60': context.disabled },

                // Interactivity
                'cursor-pointer user-select-none'
            ]
        }),
        label: {
            class: [
                // Flexbox
                'flex-initial',

                // Size
                'w-0'
            ]
        }
    },
    movealltotargetbutton: {
        root: ({ context }) => ({
            class: [
                // Flexbox & Alignment
                'relative inline-flex items-center justify-center',

                // Shape
                'rounded-md',

                // Color
                'text-white dark:text-surface-900',
                'bg-primary-500 dark:bg-primary-400',
                'border border-primary-500 dark:border-primary-400',

                // Spacing & Size
                'w-12',
                'm-0',
                'px-0 py-3',

                // Transitions
                'transition duration-200 ease-in-out',

                // State
                'hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300',
                'focus:outline-none focus:outline-offset-0 focus:ring',
                'focus:ring-primary-400/50 dark:focus:ring-primary-300/50',
                { 'cursor-default pointer-events-none opacity-60': context.disabled },

                // Interactivity
                'cursor-pointer user-select-none'
            ]
        }),
        label: {
            class: [
                // Flexbox
                'flex-initial',

                // Size
                'w-0'
            ]
        }
    },
    movetosourcebutton: {
        root: ({ context }) => ({
            class: [
                // Flexbox & Alignment
                'relative inline-flex items-center justify-center',

                // Shape
                'rounded-md',

                // Color
                'text-white dark:text-surface-900',
                'bg-primary-500 dark:bg-primary-400',
                'border border-primary-500 dark:border-primary-400',

                // Spacing & Size
                'w-12',
                'm-0',
                'px-0 py-3',

                // Transitions
                'transition duration-200 ease-in-out',

                // State
                'hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300',
                'focus:outline-none focus:outline-offset-0 focus:ring',
                'focus:ring-primary-400/50 dark:focus:ring-primary-300/50',
                { 'cursor-default pointer-events-none opacity-60': context.disabled },

                // Interactivity
                'cursor-pointer user-select-none'
            ]
        }),
        label: {
            class: [
                // Flexbox
                'flex-initial',

                // Size
                'w-0'
            ]
        }
    },
    movealltosourcebutton: {
        root: ({ context }) => ({
            class: [
                // Flexbox & Alignment
                'relative inline-flex items-center justify-center',

                // Shape
                'rounded-md',

                // Color
                'text-white dark:text-surface-900',
                'bg-primary-500 dark:bg-primary-400',
                'border border-primary-500 dark:border-primary-400',

                // Spacing & Size
                'w-12',
                'm-0',
                'px-0 py-3',

                // Transitions
                'transition duration-200 ease-in-out',

                // State
                'hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300',
                'focus:outline-none focus:outline-offset-0 focus:ring',
                'focus:ring-primary-400/50 dark:focus:ring-primary-300/50',
                { 'cursor-default pointer-events-none opacity-60': context.disabled },

                // Interactivity
                'cursor-pointer user-select-none'
            ]
        }),
        label: {
            class: [
                // Flexbox
                'flex-initial',

                // Size
                'w-0'
            ]
        }
    },
    targetcontrols: {
        class: 'flex lg:flex-col justify-center gap-2 p-5'
    },
    targetmoveupbutton: {
        root: ({ context }) => ({
            class: [
                // Flexbox & Alignment
                'relative inline-flex items-center justify-center',

                // Shape
                'rounded-md',

                // Color
                'text-white dark:text-surface-900',
                'bg-primary-500 dark:bg-primary-400',
                'border border-primary-500 dark:border-primary-400',

                // Spacing & Size
                'w-12',
                'm-0',
                'px-0 py-3',

                // Transitions
                'transition duration-200 ease-in-out',

                // State
                'hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300',
                'focus:outline-none focus:outline-offset-0 focus:ring',
                'focus:ring-primary-400/50 dark:focus:ring-primary-300/50',
                { 'cursor-default pointer-events-none opacity-60': context.disabled },

                // Interactivity
                'cursor-pointer user-select-none'
            ]
        }),
        label: {
            class: [
                // Flexbox
                'flex-initial',

                // Size
                'w-0'
            ]
        }
    },
    targetmovetopbutton: {
        root: ({ context }) => ({
            class: [
                // Flexbox & Alignment
                'relative inline-flex items-center justify-center',

                // Shape
                'rounded-md',

                // Color
                'text-white dark:text-surface-900',
                'bg-primary-500 dark:bg-primary-400',
                'border border-primary-500 dark:border-primary-400',

                // Spacing & Size
                'w-12',
                'm-0',
                'px-0 py-3',

                // Transitions
                'transition duration-200 ease-in-out',

                // State
                'hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300',
                'focus:outline-none focus:outline-offset-0 focus:ring',
                'focus:ring-primary-400/50 dark:focus:ring-primary-300/50',
                { 'cursor-default pointer-events-none opacity-60': context.disabled },

                // Interactivity
                'cursor-pointer user-select-none'
            ]
        }),
        label: {
            class: [
                // Flexbox
                'flex-initial',

                // Size
                'w-0'
            ]
        }
    },
    targetmovedownbutton: {
        root: ({ context }) => ({
            class: [
                // Flexbox & Alignment
                'relative inline-flex items-center justify-center',

                // Shape
                'rounded-md',

                // Color
                'text-white dark:text-surface-900',
                'bg-primary-500 dark:bg-primary-400',
                'border border-primary-500 dark:border-primary-400',

                // Spacing & Size
                'w-12',
                'm-0',
                'px-0 py-3',

                // Transitions
                'transition duration-200 ease-in-out',

                // State
                'hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300',
                'focus:outline-none focus:outline-offset-0 focus:ring',
                'focus:ring-primary-400/50 dark:focus:ring-primary-300/50',
                { 'cursor-default pointer-events-none opacity-60': context.disabled },

                // Interactivity
                'cursor-pointer user-select-none'
            ]
        }),
        label: {
            class: [
                // Flexbox
                'flex-initial',

                // Size
                'w-0'
            ]
        }
    },
    targetmovebottombutton: {
        root: ({ context }) => ({
            class: [
                // Flexbox & Alignment
                'relative inline-flex items-center justify-center',

                // Shape
                'rounded-md',

                // Color
                'text-white dark:text-surface-900',
                'bg-primary-500 dark:bg-primary-400',
                'border border-primary-500 dark:border-primary-400',

                // Spacing & Size
                'w-12',
                'm-0',
                'px-0 py-3',

                // Transitions
                'transition duration-200 ease-in-out',

                // State
                'hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300',
                'focus:outline-none focus:outline-offset-0 focus:ring',
                'focus:ring-primary-400/50 dark:focus:ring-primary-300/50',
                { 'cursor-default pointer-events-none opacity-60': context.disabled },

                // Interactivity
                'cursor-pointer user-select-none'
            ]
        }),
        label: {
            class: [
                // Flexbox
                'flex-initial',

                // Size
                'w-0'
            ]
        }
    },
    targetwrapper: {
        class: 'grow shrink basis-2/4'
    },
    targetheader: {
        class: [
            'font-bold',

            // Shape
            'border-b-0 rounded-t-md',

            // Spacing
            'p-5',

            // Color
            'text-surface-700 dark:text-white/80',
            'bg-surface-50 dark:bg-surface-800',
            'border border-surface-200 dark:border-surface-700'
        ]
    },
    targetlist: {
        class: [
            // Spacing
            'list-none m-0 p-0',

            // Size
            'min-h-[12rem] max-h-[24rem]',

            // Shape
            'rounded-b-md',

            // Color
            'text-surface-600 dark:text-white/80',
            'bg-surface-0 dark:bg-surface-800',
            'border border-surface-200 dark:border-surface-700',

            // Spacing
            'py-3 px-0',

            // Focus & Outline
            'outline-none',

            // Misc
            'overflow-auto'
        ]
    },
    transition: {
        enterFromClass: '!transition-none',
        enterActiveClass: '!transition-none',
        leaveActiveClass: '!transition-none',
        leaveToClass: '!transition-none'
    }
};
