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
      // Flex
      'flex items-center justify-center',

      // Shape
      'first:rounded-l-md',
      'last:rounded-r-md',
      'border-y',

      'last:border-r',
      'border-l',
      'border-r-0',

      // Space
      'p-3',

      // Size
      'min-w-[3rem]',

      // Color
      'bg-surface-50 dark:bg-surface-800',
      'text-surface-600 dark:text-surface-400',
      'border-surface-300 dark:border-surface-600'
    ]
  }
}
