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
  root: ({ context }) => ({
    class: [
      // Font
      'font-bold font-sans',
      'text-xs leading-5',

      // Alignment
      'flex items-center justify-center',
      'text-center',

      // Position
      'absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 origin-top-right',

      // Size
      'm-0',
      {
        'p-0': context.nogutter || context.dot,
        'px-2': !context.nogutter && !context.dot,
        'min-w-[0.5rem] w-2 h-2': context.dot,
        'min-w-[1.5rem] h-6': !context.dot
      },

      // Shape
      {
        'rounded-full': context.nogutter || context.dot,
        'rounded-[10px]': !context.nogutter && !context.dot
      },

      // Color
      'text-white dark:text-surface-900',
      {
        'bg-primary-500 dark:bg-primary-400':
          !context.info &&
          !context.success &&
          !context.warning &&
          !context.danger &&
          !context.help &&
          !context.secondary,
        'bg-surface-500 dark:bg-surface-400': context.secondary,
        'bg-green-500 dark:bg-green-400': context.success,
        'bg-blue-500 dark:bg-blue-400': context.info,
        'bg-orange-500 dark:bg-orange-400': context.warning,
        'bg-purple-500 dark:bg-purple-400': context.help,
        'bg-red-500 dark:bg-red-400': context.danger
      }
    ]
  })
}
