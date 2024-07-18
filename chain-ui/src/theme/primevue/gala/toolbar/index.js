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
      // Flex & Alignment
      'flex items-center justify-between flex-wrap',
      'gap-2',

      // Spacing
      'p-5',

      // Shape
      'rounded-md',

      // Color
      'bg-surface-50 dark:bg-surface-800',
      'border border-surface-200 dark:border-surface-700'
    ]
  },
  start: {
    class: 'flex items-center'
  },
  center: {
    class: 'flex items-center'
  },
  end: {
    class: 'flex items-center'
  }
}
