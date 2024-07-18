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
      // Shape
      'rounded-md',

      // Spacing
      'p-4',

      // Color
      'bg-surface-0 dark:bg-surface-700',
      'border border-surface-200 dark:border-surface-700',

      // Misc
      'overflow-x-auto'
    ]
  },
  menu: {
    class: [
      // Flex & Alignment
      'flex items-center flex-nowrap',

      // Spacing
      'm-0 p-0 list-none leading-none'
    ]
  },
  action: {
    class: [
      // Flex & Alignment
      'flex items-center',

      // Shape
      'rounded-md',

      // Color
      'text-surface-600 dark:text-white/70',

      // States
      'focus-visible:outline-none focus-visible:outline-offset-0',
      'focus-visible:ring focus-visible:ring-primary-400/50 dark:focus-visible:ring-primary-300/50',

      // Transitions
      'transition-shadow duration-200',

      // Misc
      'text-decoration-none'
    ]
  },
  icon: {
    class: 'text-surface-600 dark:text-white/70'
  },
  separator: {
    class: [
      // Flex & Alignment
      'flex items-center',

      // Spacing
      ' mx-2',

      // Color
      'text-surface-600 dark:text-white/70'
    ]
  }
}
