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
      'inline-flex items-center justify-center align-top gap-2',
      'p-3 m-0 rounded-md dark:border',
      {
        'bg-blue-100/70 dark:bg-blue-500/20': props.severity == 'info',
        'bg-green-100/70 dark:bg-green-500/20': props.severity == 'success',
        'bg-orange-100/70 dark:bg-orange-500/20': props.severity == 'warn',
        'bg-red-100/70 dark:bg-red-500/20': props.severity == 'error'
      },
      {
        'dark:border-blue-400': props.severity == 'info',
        'dark:border-green-400': props.severity == 'success',
        'dark:border-orange-400': props.severity == 'warn',
        'dark:border-red-400': props.severity == 'error'
      },
      {
        'text-blue-700 dark:text-blue-300': props.severity == 'info',
        'text-green-700 dark:text-green-300': props.severity == 'success',
        'text-orange-700 dark:text-orange-300': props.severity == 'warn',
        'text-red-700 dark:text-red-300': props.severity == 'error'
      }
    ]
  }),
  icon: {
    class: 'text-base'
  },
  text: {
    class: [
      // Font and Text
      'text-base leading-none',
      'font-medium'
    ]
  }
}
