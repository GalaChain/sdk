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
      // Flexbox
      'inline-flex items-center',

      // Spacing
      'px-3',

      // Shape
      'rounded-[1.14rem]',

      // Colors
      'text-surface-700 dark:text-white/70',
      'bg-surface-200 dark:bg-surface-700'
    ]
  },
  label: {
    class: 'leading-6 my-1.5 mx-0'
  },
  icon: {
    class: 'leading-6 mr-2'
  },
  image: {
    class: ['w-9 h-9 -ml-3 mr-2', 'rounded-full']
  },
  removeIcon: {
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
}
