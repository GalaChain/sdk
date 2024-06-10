export default {
    root: ({ props }) => ({
        class: [
            'relative',

            // Flex
            'inline-flex',

            // Size
            { 'w-full': props.multiple },

            // Color
            'text-surface-900 dark:text-surface-0',

            //States
            {
                'opacity-60 select-none pointer-events-none cursor-default': props.disabled
            }
        ]
    }),
    container: ({ props, state }) => ({
        class: [
            // Font
            'font-sans text-base leading-none',

            // Flex
            'flex items-center flex-wrap',
            'gap-2',

            // Spacing
            'm-0 list-none',
            'px-3 py-1.5',

            // Size
            'w-full',
            'min-h-[2.877rem]',

            // Shape
            'appearance-none rounded-md',

            // Color
            'text-surface-700 dark:text-white/80',
            'placeholder:text-surface-400 dark:placeholder:text-surface-500',
            'bg-surface-0 dark:bg-surface-900',
            'border border-surface-300 dark:border-surface-700',

            // States
            'hover:border-primary-500 dark:hover:border-primary-400',
            'focus:outline-none focus:outline-offset-0',
            { 'ring ring-primary-400/50 dark:ring-primary-300/50': state.focused },
            { 'ring ring-primary-400/50 dark:ring-primary-300/50': state.hovered },
            // Transition
            'transition duration-200 ease-in-out',

            // Misc
            'cursor-text overflow-hidden'
        ]
    }),
    inputtoken: {
        class: ['py-1.5 px-0', 'inline-flex flex-auto']
    },
    input: ({ props }) => ({
        class: [
            // Font
            'font-sans text-base leading-none',

            // Shape
            'appearance-none rounded-md',
            { 'rounded-tr-none rounded-br-none': props.dropdown },
            { 'outline-none shadow-none rounded-none': props.multiple },

            // Size
            { 'w-full': props.multiple },

            // Spacing
            'm-0',
            { 'p-3': !props.multiple, 'p-0': props.multiple },

            // Colors
            'text-surface-700 dark:text-white/80',
            {
                'bg-surface-0 dark:bg-surface-900': !props.multiple,
                'border border-surface-300 dark:border-surface-700': !props.multiple,
                'border-0 bg-transparent': props.multiple
            },

            // States
            { 'focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-400/50 dark:focus:ring-primary-300/50': !props.multiple },

            // Transition
            'transition-colors duration-200'
        ]
    }),
    token: {
        class: [
            // Flex
            'inline-flex items-center',

            // Spacings
            'py-1.5 px-3',

            // Shape
            'rounded-[1.14rem]',

            // Colors
            'bg-surface-200 dark:bg-surface-700',
            'text-surface-700 dark:text-white/70',

            // Misc
            'cursor-default'
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
    },
    dropdownbutton: {
        root: {
            class: [
                'relative',

                // Alignments
                'items-center inline-flex text-center align-bottom',

                // Shape
                'rounded-r-md',

                // Size
                'px-4 py-3 leading-none',

                // Colors
                'text-white dark:text-surface-900',
                'bg-primary-500 dark:bg-primary-400',
                'border border-primary-500 dark:border-primary-400',

                // States
                'focus:outline-none focus:outline-offset-0 focus:ring',
                'hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300',
                'focus:ring-primary-400/50 dark:focus:ring-primary-300/50'
            ]
        }
    },
    loadingicon: {
        class: ['text-surface-500 dark:text-surface-0/70', 'absolute top-[50%] right-[0.5rem] -mt-2 animate-spin']
    },
    panel: {
        class: [
            // Colors
            'bg-surface-0 dark:bg-surface-800',
            'text-surface-700 dark:text-white/80',

            // Shape
            'border-0',
            'rounded-md',
            'shadow-md',

            // Size
            'max-h-[200px] overflow-auto'
        ]
    },
    list: {
        class: 'py-3 px-0 list-none m-0'
    },
    item: ({ context }) => ({
        class: [
            'relative',

            // Font
            'font-normal text-base leading-none',

            // Spacing
            'm-0 px-5 py-3',

            // Shape
            'border-0 rounded-none',

            // Colors
            {
                'text-surface-700 dark:text-white/80': !context.focused && !context.selected,
                'bg-surface-200 dark:bg-surface-600/60': context.focused && !context.selected,
                'text-surface-700 dark:text-white/80': context.focused && !context.selected,

                'text-primary-700 dark:text-white/80': context.focused && context.selected,
                'bg-primary-100 dark:bg-primary-400': context.focused && context.selected,
                'text-primary-700 dark:text-white/80': !context.focused && context.selected,
                'bg-primary-50 dark:bg-primary-300': !context.focused && context.selected
            },

            //States
            { 'hover:bg-surface-100 dark:hover:bg-surface-600/80': !context.focused && !context.selected },
            { 'hover:text-surface-700 hover:bg-surface-100 dark:hover:text-white dark:hover:bg-surface-600/80': context.focused && !context.selected },

            // Transition
            'transition-shadow duration-200',

            // Misc
            'cursor-pointer overflow-hidden whitespace-nowrap'
        ]
    }),
    itemgroup: {
        class: [
            'font-bold',

            // Spacing
            'm-0 p-3',

            // Colors
            'bg-surface-0 dark:bg-surface-700',
            'text-surface-800 dark:text-white/80',

            // Misc
            'cursor-auto'
        ]
    },
    emptymessage: {
        class: [
            // Font
            'leading-none',

            // Spacing
            'py-3 px-5',

            // Color
            'text-surface-800 dark:text-white/80',
            'bg-transparent'
        ]
    },
    transition: {
        enterFromClass: 'opacity-0 scale-y-[0.8]',
        enterActiveClass: 'transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]',
        leaveActiveClass: 'transition-opacity duration-100 ease-linear',
        leaveToClass: 'opacity-0'
    }
};
