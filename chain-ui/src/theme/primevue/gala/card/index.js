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
      //Shape
      'rounded-md',
      'shadow-md',

      //Color
      'bg-surface-0 dark:bg-surface-900',
      'text-surface-700 dark:text-surface-0'
    ]
  },
  body: {
    class: 'p-5'
  },
  title: {
    class: 'text-2xl font-bold mb-2'
  },
  subtitle: {
    class: [
      //Font
      'font-normal',

      //Spacing
      'mb-2',

      //Color
      'text-surface-600 dark:text-surface-0/60'
    ]
  },
  content: {
    class: 'py-5' // Vertical padding.
  },
  footer: {
    class: 'pt-5' // Top padding.
  }
}
