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
      'min-w-[10rem]',
      'rounded-lg',
      // Spacing
      'py-2',
      // Colors
      'bg-surface-1000/10 dark:bg-surface-0/10 backdrop-blur-xl',
      'text-surface-primary',
      'border border-surface-1000/10 dark:border-surface-0/10'
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
  menuitem: () => ({
    class: ['border-b last:border-b-0 border-b-surface-1000/10 dark:border-b-surface-0/10']
  }),
  content: () => ({
    class: [
      // Shape
      'rounded-none',
      // Colors
      //   'text-surface-700 dark:text-white/80',
      //   {
      //     'bg-surface-200 text-surface-700 dark:bg-surface-300/10 dark:text-white':
      //       context.focused,
      //   },
      // Transitions
      'transition-shadow',
      'duration-200',
      // States
      'hover:text-surface-700 dark:hover:text-white/80',
      'hover:bg-surface-100/10 dark:hover:bg-surface-400/10'
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
      'text-surface-primary',

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
  submenuheader: {
    class: [
      // Font
      'font-bold',
      // Spacing
      'm-0',
      'py-3 px-5',
      // Shape
      'rounded-tl-none',
      'rounded-tr-none',
      // Colors
      'bg-surface-0 dark:bg-surface-700',
      'text-surface-700 dark:text-white'
    ]
  },
  transition: {
    enterFromClass: 'opacity-0 scale-y-[0.8]',
    enterActiveClass:
      'transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]',
    leaveActiveClass: 'transition-opacity duration-100 ease-linear',
    leaveToClass: 'opacity-0'
  }
}
