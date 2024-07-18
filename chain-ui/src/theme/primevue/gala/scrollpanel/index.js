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
  wrapper: {
    class: [
      // Size & Position
      'h-full w-full',

      // Layering
      'z-[1]',

      // Spacing
      'overflow-hidden',

      // Misc
      'relative float-left'
    ]
  },
  content: {
    class: [
      // Size & Spacing
      'h-[calc(100%+18px)] w-[calc(100%+18px)] pr-[18px] pb-[18px] pl-0 pt-0',

      // Overflow & Scrollbar
      'overflow-scroll scrollbar-none',

      // Box Model
      'box-border',

      // Position
      'relative',

      // Webkit Specific
      '[&::-webkit-scrollbar]:hidden'
    ]
  },
  barX: {
    class: [
      // Size & Position
      'h-[9px] bottom-0',

      // Appearance
      'bg-surface-50 dark:bg-surface-700 rounded',

      // Interactivity
      'cursor-pointer',

      // Visibility & Layering
      'invisible z-20',

      // Transition
      'transition duration-[250ms] ease-linear',

      // Misc
      'relative'
    ]
  },
  barY: {
    class: [
      // Size & Position
      'w-[9px] top-0',

      // Appearance
      'bg-surface-50 dark:bg-surface-700 rounded',

      // Interactivity
      'cursor-pointer',

      // Visibility & Layering
      'z-20',

      // Transition
      'transition duration-[250ms] ease-linear',

      // Misc
      'relative'
    ]
  }
}
