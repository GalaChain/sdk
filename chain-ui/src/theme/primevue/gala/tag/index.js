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
      //Font
      'text-xs font-bold',

      //Alignments
      'inline-flex items-center justify-center',

      //Spacing
      'px-2 py-1',

      //Shape
      {
        'rounded-md': !props.rounded,
        'rounded-full': props.rounded
      },

      //Colors
      'text-white dark:text-surface-900',
      {
        'bg-primary-500 dark:bg-primary-400': props.severity == null || props.severity == 'primary',
        'bg-green-500 dark:bg-green-400': props.severity == 'success',
        'bg-blue-500 dark:bg-blue-400': props.severity == 'info',
        'bg-orange-500 dark:bg-orange-400': props.severity == 'warning',
        'bg-red-500 dark:bg-red-400': props.severity == 'danger'
      }
    ]
  }),
  value: {
    class: 'leading-normal'
  },
  icon: {
    class: 'mr-1 text-sm'
  }
}
