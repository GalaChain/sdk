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
  root: ({ props }) => ({
    class: [
      // Font
      'font-bold',

      {
        'text-xs leading-[1.5rem]': props.size == null,
        'text-lg leading-[2.25rem]': props.size == 'large',
        'text-2xl leading-[3rem]': props.size == 'xlarge'
      },

      // Alignment
      'text-center inline-block',

      // Size
      'p-0 px-1',
      {
        'min-w-[1.5rem] h-[1.5rem]': props.size == null,
        'min-w-[2.25rem] h-[2.25rem]': props.size == 'large',
        'min-w-[3rem] h-[3rem]': props.size == 'xlarge'
      },

      // Shape
      {
        'rounded-full': props.value.length == 1,
        'rounded-[0.71rem]': props.value.length !== 1
      },

      // Color
      'text-white dark:text-surface-900',
      {
        'bg-primary-500 dark:bg-primary-400': props.severity == null || props.severity == 'primary',
        'bg-surface-500 dark:bg-surface-400': props.severity == 'secondary',
        'bg-green-500 dark:bg-green-400': props.severity == 'success',
        'bg-blue-500 dark:bg-blue-400': props.severity == 'info',
        'bg-orange-500 dark:bg-orange-400': props.severity == 'warning',
        'bg-purple-500 dark:bg-purple-400': props.severity == 'help',
        'bg-red-500 dark:bg-red-400': props.severity == 'danger'
      }
    ]
  })
}
