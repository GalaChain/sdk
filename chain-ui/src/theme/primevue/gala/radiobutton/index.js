export default {
    root: {
        class: [
            'relative',

            // Flexbox & Alignment
            'inline-flex',
            'align-bottom',

            // Size
            'w-[1.571rem] h-[1.571rem]',

            // Misc
            'cursor-pointer',
            'select-none'
        ]
    },
    box: ({ props }) => ({
        class: [
            // Flexbox
            'flex justify-center items-center',

            // Size
            'w-[1.571rem] h-[1.571rem]',

            // Shape
            'border-2',
            'rounded-full',

            // Transition
            'transition duration-200 ease-in-out',

            // Colors
            {
                'text-surface-700 dark:text-white/80': props.value !== props.modelValue && props.value !== undefined,
                'bg-surface-0 dark:bg-surface-900': props.value !== props.modelValue && props.value !== undefined,
                'border-surface-300 dark:border-surface-700': props.value !== props.modelValue && props.value !== undefined,
                'border-primary-500 dark:border-primary-400': props.value == props.modelValue && props.value !== undefined,
                'bg-primary-500 dark:bg-primary-400': props.value == props.modelValue && props.value !== undefined
            },

            // States
            {
                'peer-hover:border-primary-500 dark:peer-hover:border-primary-400': !props.disabled,
                'peer-hover:border-primary-600 dark:peer-hover:border-primary-300 peer-hover:bg-primary-600 dark:peer-hover:bg-primary-300': !props.disabled && props.value == props.modelValue && props.value !== undefined,
                'peer-focus-visible:border-primary-500 dark:peer-focus-visible:border-primary-400 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400/20 dark:peer-focus-visible:ring-primary-300/20': !props.disabled,
                'opacity-60 cursor-default': props.disabled
            }
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
    icon: ({ props }) => ({
        class: [
            'block',

            // Shape
            'rounded-full',

            // Size
            'w-[0.857rem] h-[0.857rem]',

            // Colors
            'bg-surface-0 dark:bg-surface-900',

            // Conditions
            {
                'backface-hidden scale-10 invisible': props.value !== props.modelValue,
                'transform visible scale-[1.1]': props.value == props.modelValue
            },

            // Transition
            'transition duration-200'
        ]
    })
};
