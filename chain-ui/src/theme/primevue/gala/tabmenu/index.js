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
    class: 'overflow-x-auto'
  },
  menu: {
    class: [
      // Flexbox
      'flex flex-1',

      // Spacing
      'list-none',
      'p-0 m-0',

      // Colors
      'border-b border-surface-200 dark:border-surface-0/10',
      'text-surface-400 dark:text-surface-600'
    ]
  },
  menuitem: {
    class: 'mr-0'
  },
  action: ({ context, state }) => ({
    class: [
      'relative',

      // Font
      'font-bold',

      // Flexbox and Alignment
      'flex items-center',

      // Spacing
      'p-5',
      '-mb-[1px]',

      // Shape
      'border-b',
      'rounded-t-md',

      // Colors and Conditions
      {
        'border-surface-0/0 dark:border-surface-0/0': state.d_activeIndex !== context.index,
        'text-surface-400 dark:text-surface-600': state.d_activeIndex !== context.index,
        'border-white dark:border-surface-0': state.d_activeIndex === context.index,
        'text-surface-900 dark:text-surface-0': state.d_activeIndex === context.index
      },

      // States
      'focus-visible:outline-none focus-visible:outline-offset-0 focus-visible:ring focus-visible:ring-inset',
      'focus-visible:ring-white dark:focus-visible:ring-white',
      {
        'hover:text-surface-600 dark:hover:text-surface-0': state.d_activeIndex !== context.index
      },

      // Transitions
      'transition-all duration-200',

      // Misc
      'cursor-pointer select-none text-decoration-none',
      'overflow-hidden',
      'user-select-none'
    ]
  }),
  icon: {
    class: 'mr-2'
  }
}
