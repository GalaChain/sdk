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
      'font-sans leading-none',

      // Spacing
      'm-0 p-3',

      // Colors
      'text-surface-600 dark:text-surface-200',
      'placeholder:text-surface-400 dark:placeholder:text-surface-500',
      'bg-surface-0 dark:bg-surface-900',
      'border border-surface-300 dark:border-surface-600',

      // States
      {
        'hover:border-primary-500 dark:hover:border-primary-400': !context.disabled,
        'focus:outline-none focus:outline-offset-0 focus:ring focus:ring-primary-500/50 dark:focus:ring-primary-400/50':
          !context.disabled,
        'opacity-60 select-none pointer-events-none cursor-default': context.disabled
      },

      // Misc
      'rounded-md',
      'appearance-none',
      'transition-colors duration-200'
    ]
  })
}
