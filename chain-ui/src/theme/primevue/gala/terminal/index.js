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
      // Spacing
      'p-5',

      // Shape
      'rounded-md',

      // Color
      'bg-surface-900 text-white',
      'border border-surface-700',

      // Sizing & Overflow
      'h-72 overflow-auto'
    ]
  },
  container: {
    class: [
      // Flexbox
      'flex items-center'
    ]
  },
  prompt: {
    class: [
      // Color
      'text-surface-400'
    ]
  },
  response: {
    class: [
      // Color
      'text-primary-400'
    ]
  },
  command: {
    class: [
      // Color
      'text-primary-400'
    ]
  },
  commandtext: {
    class: [
      // Flexbox
      'flex-1 shrink grow-0',

      // Shape
      'border-0',

      // Spacing
      'p-0',

      // Color
      'bg-transparent text-inherit',

      // Outline
      'outline-none'
    ]
  }
}
