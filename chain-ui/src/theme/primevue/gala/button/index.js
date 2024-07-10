export default {
  root: ({ props, context, parent }) => ({
    class: [
      'relative',

      // Alignments
      'items-center inline-flex text-center align-bottom justify-center',

      // Sizes & Spacing
      'leading-normal',
      {
        'px-6 py-3': props.size === null && props.label !== null,
        'text-sm py-2 px-4': props.size === 'small',
        'px-8 py-4': props.size === 'large'
      },
      {
        'w-12 p-0 py-3': props.label == null
      },

      // Shapes
      { 'shadow-lg': props.raised },
      { 'rounded-md': !props.rounded, 'rounded-full': props.rounded },
      {
        'rounded-none first:rounded-l-md last:rounded-r-md': parent.instance.$name === 'InputGroup'
      },

      // Link Button
      {
        'text-primary-600 dark:text-primary-500 bg-transparent border-transparent': props.link
      },

      // Plain Button
      {
        'text-white bg-gray-500 border border-gray-500':
          props.plain && !props.outlined && !props.text
      },
      // Plain Text Button
      { 'text-surface-500': props.plain && props.text },
      // Plain Outlined Button
      {
        'text-surface-500 border border-gray-500': props.plain && props.outlined
      },

      // Text Button
      { 'bg-transparent border-transparent': props.text && !props.plain },

      // Outlined Button
      { 'bg-transparent border': props.outlined && !props.plain },

      // --- Severity Buttons ---

      // Primary Button
      {
        'text-surface-0 dark:text-surface-1000 hocus:text-surface-1000 hocus:dark:text-surface-0':
          !props.link && props.severity === null && !props.text && !props.outlined && !props.plain,
        'bg-primary-600 dark:bg-primary-500 hocus:bg-surface-0 hocus:dark:bg-surface-1000':
          !props.link && props.severity === null && !props.text && !props.outlined && !props.plain,
        'border border-primary-600 dark:border-primary-500 hocus:border-surface-0 hocus:dark:border-surface-1000':
          !props.link && props.severity === null && !props.text && !props.outlined && !props.plain
      },
      // Primary Text Button
      {
        'text-primary-600 dark:text-primary-500 hocus:text-surface-0 hocus:dark:text-surface-1000':
          props.text && props.severity === null && !props.plain
      },
      // Primary Outlined Button
      {
        'text-primary-600 border border-primary-600 dark:text-primary-500 dark:border-primary-500 hocus:bg-primary-600 hocus:dark:bg-primary-500':
          props.outlined && props.severity === null && !props.plain
      },

      // Secondary Button
      {
        'text-surface-primary hocus:text-surface-0 hocus:dark:text-surface-1000':
          props.severity === 'secondary' && !props.text && !props.outlined && !props.plain,
        'bg-surface-200 dark:bg-surface-850 hocus:bg-surface-1000 hocus:dark:bg-surface-0':
          props.severity === 'secondary' && !props.text && !props.outlined && !props.plain,
        'border border-surface-200 dark:border-surface-850 hocus:border-surface-1000 hocus:dark:border-surface-0':
          props.severity === 'secondary' && !props.text && !props.outlined && !props.plain
      },
      // Secondary Text Button
      {
        'text-surface-500 dark:text-surface-300':
          props.text && props.severity === 'secondary' && !props.plain
      },
      // Secondary Outlined Button
      {
        'text-surface-500 dark:text-surface-300 border border-surface-500 hover:bg-surface-300/20':
          props.outlined && props.severity === 'secondary' && !props.plain
      },

      // Contrast Button
      {
        'text-surface-0 dark:text-surface-1000':
          props.severity === 'contrast' && !props.text && !props.outlined && !props.plain,
        'bg-surface-1000 dark:bg-surface-0':
          props.severity === 'contrast' && !props.text && !props.outlined && !props.plain,
        // 'hocus:bg-surface-950 hocus:dark:bg-surface-100 hocus:bg-surface-950 hocus:dark:border-surface-100':
        'hocus:bg-primary-600 hocus:dark:bg-primary-500 hocus:border-primary-600 hocus:dark:border-primary-500':
          props.severity === 'contrast' && !props.text && !props.outlined && !props.plain,
        'border border-surface-1000 dark:border-surface-0':
          props.severity === 'contrast' && !props.text && !props.outlined && !props.plain
      },
      // Contrast B&W Button
      {
        'text-surface-0 dark:text-surface-1000':
          props.severity === 'contrast-bw' && !props.text && !props.outlined && !props.plain,
        'bg-surface-1000 dark:bg-surface-0':
          props.severity === 'contrast-bw' && !props.text && !props.outlined && !props.plain,
        // 'hocus:bg-surface-950 hocus:dark:bg-surface-100 hocus:bg-surface-950 hocus:dark:border-surface-100':
        'hocus:bg-surface-0 hocus:dark:bg-surface-1000 hocus:text-surface-1000 hocus:dark:text-surface-0 hocus:border-surface-0 hocus:dark:border-surface-1000':
          props.severity === 'contrast-bw' && !props.text && !props.outlined && !props.plain,
        'border border-surface-1000 dark:border-surface-0':
          props.severity === 'contrast-bw' && !props.text && !props.outlined && !props.plain
      },
      // Contrast Text Button
      {
        'text-surface-primary hocus:text-primary-600 hocus:dark:text-primary-500':
          props.text && props.severity === 'contrast' && !props.plain
      },
      // Contrast Outlined Button
      {
        'text-surface-primary border border-surface-1000 dark:border-surface-0 hocus:bg-surface-1000/20 hocus:dark:bg-surface-0/20':
          props.outlined && props.severity === 'contrast' && !props.plain
      },

      // Success Button
      {
        'text-white dark:text-green-900':
          props.severity === 'success' && !props.text && !props.outlined && !props.plain,
        'bg-green-500 dark:bg-green-400':
          props.severity === 'success' && !props.text && !props.outlined && !props.plain,
        'border border-green-500 dark:border-green-400':
          props.severity === 'success' && !props.text && !props.outlined && !props.plain
      },
      // Success Text Button
      {
        'text-green-500 dark:text-green-400':
          props.text && props.severity === 'success' && !props.plain
      },
      // Success Outlined Button
      {
        'text-green-500 border border-green-500 hover:bg-green-300/20':
          props.outlined && props.severity === 'success' && !props.plain
      },

      // Info Button
      {
        'text-white dark:text-surface-900':
          props.severity === 'info' && !props.text && !props.outlined && !props.plain,
        'bg-blue-500 dark:bg-blue-400':
          props.severity === 'info' && !props.text && !props.outlined && !props.plain,
        'border border-blue-500 dark:border-blue-400':
          props.severity === 'info' && !props.text && !props.outlined && !props.plain
      },
      // Info Text Button
      {
        'text-blue-500 dark:text-blue-400': props.text && props.severity === 'info' && !props.plain
      },
      // Info Outlined Button
      {
        'text-blue-500 border border-blue-500 hover:bg-blue-300/20 ':
          props.outlined && props.severity === 'info' && !props.plain
      },

      // Warning Button
      {
        'text-white dark:text-surface-900':
          props.severity === 'warning' && !props.text && !props.outlined && !props.plain,
        'bg-orange-500 dark:bg-orange-400':
          props.severity === 'warning' && !props.text && !props.outlined && !props.plain,
        'border border-orange-500 dark:border-orange-400':
          props.severity === 'warning' && !props.text && !props.outlined && !props.plain
      },
      // Warning Text Button
      {
        'text-orange-500 dark:text-orange-400':
          props.text && props.severity === 'warning' && !props.plain
      },
      // Warning Outlined Button
      {
        'text-orange-500 border border-orange-500 hover:bg-orange-300/20':
          props.outlined && props.severity === 'warning' && !props.plain
      },

      // Help Button
      {
        'text-white dark:text-surface-900':
          props.severity === 'help' && !props.text && !props.outlined && !props.plain,
        'bg-purple-500 dark:bg-purple-400':
          props.severity === 'help' && !props.text && !props.outlined && !props.plain,
        'border border-purple-500 dark:border-purple-400':
          props.severity === 'help' && !props.text && !props.outlined && !props.plain
      },
      // Help Text Button
      {
        'text-purple-500 dark:text-purple-400':
          props.text && props.severity === 'help' && !props.plain
      },
      // Help Outlined Button
      {
        'text-purple-500 border border-purple-500 hover:bg-purple-300/20':
          props.outlined && props.severity === 'help' && !props.plain
      },

      // Danger Button
      {
        'text-white dark:text-surface-900':
          props.severity === 'danger' && !props.text && !props.outlined && !props.plain,
        'bg-red-500 dark:bg-red-400':
          props.severity === 'danger' && !props.text && !props.outlined && !props.plain,
        'border border-red-500 dark:border-red-400':
          props.severity === 'danger' && !props.text && !props.outlined && !props.plain
      },
      // Danger Text Button
      {
        'text-red-500 dark:text-red-400': props.text && props.severity === 'danger' && !props.plain
      },
      // Danger Outlined Button
      {
        'text-red-500 border border-red-500 hover:bg-red-300/20':
          props.outlined && props.severity === 'danger' && !props.plain
      },

      // --- Severity Button States ---
      'focus:outline-none focus:outline-offset-0 focus-visible:focus-ring focus-visible:focus-ring-offset',

      // Link
      {
        'focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50': props.link
      },

      // Plain
      {
        'hover:bg-gray-600 hover:border-gray-600': props.plain && !props.outlined && !props.text
      },
      // Text & Outlined Button
      {
        'hover:bg-surface-300/20': props.plain && (props.text || props.outlined)
      },

      // Primary
      {
        'hover:bg-primary-600 dark:hover:bg-primary-300 hover:border-primary-600 dark:hover:border-primary-300':
          !props.link && props.severity === null && !props.text && !props.outlined && !props.plain
      },
      // {
      //   'focus:ring-primary-400/50 dark:focus:ring-primary-300/50':
      //     props.severity === null,
      // },
      // Text & Outlined Button
      {
        'hover:bg-primary-300/20':
          (props.text || props.outlined) && props.severity === null && !props.plain
      },

      // Secondary
      {
        'hover:bg-surface-600 dark:hover:bg-surface-300 hover:border-surface-600 dark:hover:border-surface-300':
          props.severity === 'secondary' && !props.text && !props.outlined && !props.plain
      },
      // {
      //   'focus:ring-surface-400/50 dark:focus:ring-surface-300/50':
      //     props.severity === 'secondary',
      // },
      // Text & Outlined Button
      {
        'hover:bg-surface-300/20':
          (props.text || props.outlined) && props.severity === 'secondary' && !props.plain
      },

      // Success
      {
        'hover:bg-green-600 dark:hover:bg-green-300 hover:border-green-600 dark:hover:border-green-300':
          props.severity === 'success' && !props.text && !props.outlined && !props.plain
      },
      // {
      //   'focus:ring-green-400/50 dark:focus:ring-green-300/50':
      //     props.severity === 'success',
      // },
      // Text & Outlined Button
      {
        'hover:bg-green-300/20':
          (props.text || props.outlined) && props.severity === 'success' && !props.plain
      },

      // Info
      {
        'hover:bg-blue-600 dark:hover:bg-blue-300 hover:border-blue-600 dark:hover:border-blue-300':
          props.severity === 'info' && !props.text && !props.outlined && !props.plain
      },
      // {
      //   'focus:ring-blue-400/50 dark:focus:ring-blue-300/50':
      //     props.severity === 'info',
      // },
      // Text & Outlined Button
      {
        'hover:bg-blue-300/20':
          (props.text || props.outlined) && props.severity === 'info' && !props.plain
      },

      // Warning
      {
        'hover:bg-orange-600 dark:hover:bg-orange-300 hover:border-orange-600 dark:hover:border-orange-300':
          props.severity === 'warning' && !props.text && !props.outlined && !props.plain
      },
      // {
      //   'focus:ring-orange-400/50 dark:focus:ring-orange-300/50':
      //     props.severity === 'warning',
      // },
      // Text & Outlined Button
      {
        'hover:bg-orange-300/20':
          (props.text || props.outlined) && props.severity === 'warning' && !props.plain
      },

      // Help
      {
        'hover:bg-purple-600 dark:hover:bg-purple-300 hover:border-purple-600 dark:hover:border-purple-300':
          props.severity === 'help' && !props.text && !props.outlined && !props.plain
      },
      // {
      //   'focus:ring-purple-400/50 dark:focus:ring-purple-300/50':
      //     props.severity === 'help',
      // },
      // Text & Outlined Button
      {
        'hover:bg-purple-300/20':
          (props.text || props.outlined) && props.severity === 'help' && !props.plain
      },

      // Danger
      {
        'hover:bg-red-600 dark:hover:bg-red-300 hover:border-red-600 dark:hover:border-red-300':
          props.severity === 'danger' && !props.text && !props.outlined && !props.plain
      },
      // {
      //   'focus:ring-red-400/50 dark:focus:ring-red-300/50':
      //     props.severity === 'danger',
      // },
      // Text & Outlined Button
      {
        'hover:bg-red-300/20':
          (props.text || props.outlined) && props.severity === 'danger' && !props.plain
      },

      // Disabled
      { 'opacity-60 pointer-events-none cursor-default': context.disabled },

      // Transitions
      'transition',

      // Misc
      'cursor-pointer overflow-hidden select-none'
    ]
  }),
  label: ({ props }) => ({
    class: [
      // 'duration-200',
      'font-semibold',
      {
        'hover:underline': props.link
      },
      { 'flex-1': props.label !== null, 'invisible w-0': props.label == null }
    ]
  }),
  icon: ({ props }) => ({
    class: [
      'mx-0',
      {
        'mr-2': props.iconPos === 'left' && props.label != null,
        'ml-2 order-1': props.iconPos === 'right' && props.label != null,
        'mb-2': props.iconPos === 'top' && props.label != null,
        'mt-2': props.iconPos === 'bottom' && props.label != null
      }
    ]
  }),
  loadingicon: ({ props }) => ({
    class: [
      'h-4 w-4',
      'mx-0',
      {
        'mr-2': props.iconPos === 'left' && props.label != null,
        'ml-2 order-1': props.iconPos === 'right' && props.label != null,
        'mb-2': props.iconPos === 'top' && props.label != null,
        'mt-2': props.iconPos === 'bottom' && props.label != null
      },
      'animate-spin'
    ]
  }),
  badge: ({ props }) => ({
    class: [
      {
        'ml-2 w-4 h-4 leading-none flex items-center justify-center': props.badge
      }
    ]
  })
}
