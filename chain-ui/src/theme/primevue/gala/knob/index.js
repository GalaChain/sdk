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
      // Misc
      { 'opacity-60 select-none pointer-events-none cursor-default': props.disabled }
    ]
  }),
  range: {
    class: [
      // Stroke
      'stroke-current',

      // Color
      'stroke-surface-200 dark:stroke-surface-700',

      // Fill
      'fill-none',

      // Transition
      'transition duration-100 ease-in'
    ]
  },
  value: {
    class: [
      // Animation
      'animate-dash-frame',

      // Color
      'stroke-primary-500 dark:stroke-primary-400',

      // Fill
      'fill-none'
    ]
  },
  label: {
    class: [
      // Text Style
      'text-center text-xl',

      // Color
      'fill-surface-600 dark:fill-surface-200'
    ]
  }
}
