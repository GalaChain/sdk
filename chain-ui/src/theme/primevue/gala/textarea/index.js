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
      'm-0',
      'p-3',

      // Shape
      'rounded-xl',

      // Colors
      'text-surface-primary',
      'placeholder:text-surface-secondary',
      'bg-surface-200 dark:bg-surface-850',
      'border-0 border-surface-200 dark:border-surface-850',

      // States
      {
        'focus:outline-none ring-1 ring-inset ring-transparent ring-opacity-50 focus-visible:focus-ring':
          !context.disabled,
        'opacity-60 select-none pointer-events-none cursor-default': context.disabled
      },

      // Misc
      'appearance-none',
      'transition-colors duration-200'
    ]
  })
}
