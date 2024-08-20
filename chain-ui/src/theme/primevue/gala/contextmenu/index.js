/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export default {
  root: {
    class: [
      // Sizing and Shape
      'min-w-[12rem]',
      'rounded-md',
      'shadow-md',

      // Spacing
      'py-2',

      // Colors
      'bg-surface-0 dark:bg-surface-700',
      'text-surface-700 dark:text-white/80',
      'dark:border dark:border-surface-700'
    ]
  },
  menu: {
    class: [
      // Spacings and Shape
      'list-none',
      'm-0',
      'p-0',
      'outline-none'
    ]
  },
  menuitem: {
    class: 'relative'
  },
  content: ({ context }) => ({
    class: [
      //Shape
      'rounded-none',
      // Colors
      'text-surface-700 dark:text-white/80',
      {
        'text-surface-500 dark:text-white/70': !context.focused && !context.active,
        'text-surface-500 dark:text-white/70 bg-surface-200 dark:bg-surface-600/90':
          context.focused && !context.active,
        'text-primary-700 dark:text-surface-0/80 bg-primary-50 dark:bg-primary-400/30':
          (context.focused && context.active) || (!context.focused && context.active)
      },

      // Transitions
      'transition-shadow',
      'duration-200',

      // States
      {
        'hover:bg-surface-100 dark:hover:bg-surface-600/80': !context.active,
        'hover:bg-primary-400/30 dark:hover:bg-primary-300/30 text-primary-700 dark:text-surface-0/80':
          context.active
      }
    ]
  }),
  action: {
    class: [
      'relative',
      // Flexbox

      'flex',
      'items-center',

      // Spacing
      'py-3',
      'px-5',

      // Color
      'text-surface-700 dark:text-white/80',

      // Misc
      'no-underline',
      'overflow-hidden',
      'cursor-pointer',
      'select-none'
    ]
  },
  icon: {
    class: [
      // Spacing
      'mr-2',

      // Color
      'text-surface-600 dark:text-white/70'
    ]
  },
  label: {
    class: ['leading-none']
  },
  submenu: ({ props }) => ({
    class: [
      // Size
      'w-full sm:w-48',

      // Spacing
      'py-1',
      'm-0',
      'list-none',

      // Shape
      'shadow-md',
      'rounded-md',
      'dark:border dark:border-surface-700',

      // Position
      'static sm:absolute',
      'z-10',
      { 'sm:absolute sm:left-full sm:top-0': props.level > 1 },

      // Color
      'bg-surface-0 dark:bg-surface-700'
    ]
  }),
  submenuicon: {
    class: ['ml-auto']
  },
  separator: {
    class: 'border-t border-surface-200 dark:border-surface-600 my-1'
  },
  transition: {
    enterFromClass: 'opacity-0',
    enterActiveClass: 'transition-opacity duration-250'
  }
}
