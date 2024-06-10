export default {
    root: ({ props }) => ({
        class: [
            'flex',
            {
                'opacity-60 select-none pointer-events-none cursor-default': props.disabled
            }
        ]
    }),
    container: ({ state }) => ({
        class: [
            // Font
            'font-sans text-base leading-none',

            // Flex
            'flex items-center flex-wrap gap-2',

            // Spacing
            'm-0 py-1.5 px-3',

            // Size
            'w-full',
            'min-h-[2.877rem]',

            // Shape
            'list-none',
            'rounded-md',

            // Color
            'text-surface-700 dark:text-white/80',
            'bg-surface-0 dark:bg-surface-900',
            'border border-surface-300 dark:border-surface-700',

            // States
            'hover:border-primary-500 dark:hover:border-primary-400',
            'focus:outline-none focus:outline-offset-0',
            { 'ring ring-primary-400/50 dark:ring-primary-300/50': state.focused },
            { 'ring ring-primary-400/50 dark:ring-primary-300/50': state.hovered },

            // Transition
            'transition-colors duration-200',

            // Misc
            'cursor-text overflow-hidden',
            'appearance-none'
        ]
    }),

    inputtoken: {
        class: ['py-1.5 px-0', 'inline-flex flex-auto']
    },
    input: {
        class: [
            // Font
            'font-sans text-base leading-[1.2]',

            // Size
            'w-full',

            // Spacing
            'p-0 m-0',

            // Shape
            'appearance-none rounded-none',
            'border-0 outline-none',
            'shadow-none',

            // Color
            'text-surface-700 dark:text-white/80',
            'bg-transparent'
        ]
    },
    token: {
        class: [
            // Flexbox
            'inline-flex items-center',

            // Spacing
            'py-1.5 px-3',

            // Shape
            'rounded-[1.14rem]',

            // Colors
            'text-surface-700 dark:text-white/70',
            'bg-surface-200 dark:bg-surface-700'
        ]
    },
    label: {
        class: 'leading-5'
    },
    removeTokenIcon: {
        class: [
            // Shape
            'rounded-md leading-6',

            // Spacing
            'ml-2',

            // Size
            'w-4 h-4',

            // Transition
            'transition duration-200 ease-in-out',

            // Misc
            'cursor-pointer'
        ]
    }
};
