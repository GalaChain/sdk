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
      'rounded-md shadow-lg',
      'border-0 dark:border',

      // Position
      'absolute left-0 top-0 mt-2',
      'z-40 transform origin-center',

      // Color
      'bg-surface-0 dark:bg-surface-800',
      'text-surface-700 dark:text-surface-0/80',
      'dark:border-surface-700',

      // Before: Triangle
      'before:absolute before:-top-2 before:ml-4',
      'before:w-0 before:h-0',
      'before:border-transparent before:border-solid',
      'before:border-x-[0.5rem] before:border-b-[0.5rem]',
      'before:border-t-0 before:border-b-surface-0 dark:before:border-b-surface-800'
    ]
  },
  content: {
    class: 'p-5 items-center flex'
  },
  transition: {
    enterFromClass: 'opacity-0 scale-y-[0.8]',
    enterActiveClass:
      'transition-[transform,opacity] duration-[120ms] ease-[cubic-bezier(0,0,0.2,1)]',
    leaveActiveClass: 'transition-opacity duration-100 ease-linear',
    leaveToClass: 'opacity-0'
  }
}
