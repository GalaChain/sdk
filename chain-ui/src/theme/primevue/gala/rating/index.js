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
      'relative',

      // Flex & Alignment
      'flex items-center',
      'gap-2',

      // Misc
      {
        'opacity-60 select-none pointer-events-none cursor-default': props.disabled
      }
    ]
  }),
  cancelitem: ({ context }) => ({
    class: [
      // Flex & Alignment
      'inline-flex items-center',

      //State
      {
        'outline-none ring ring-primary-500/50 dark:ring-primary-400/50': context.focused
      },

      // Misc
      'cursor-pointer'
    ]
  }),
  cancelicon: {
    class: [
      // Size
      'w-5 h-5',

      // Color
      'text-red-500 dark:text-red-400',

      // State
      'hover:text-red-600 dark:hover:text-red-300',

      // Transition
      'transition duration-200 ease-in'
    ]
  },
  item: ({ props, context }) => ({
    class: [
      // Flex & Alignment
      'inline-flex items-center',

      // State
      {
        'outline-none ring ring-primary-500/50 dark:ring-primary-400/50': context.focused
      },

      // Misc
      {
        'cursor-pointer': !props.readonly,
        'cursor-default': props.readonly
      }
    ]
  }),
  officon: ({ props }) => ({
    class: [
      // Size
      'w-5 h-5',

      // Color
      'text-surface-700 dark:text-surface-0/80',

      // State
      { 'hover:text-primary-500 dark:hover:text-primary-400': !props.readonly },

      // Transition
      'transition duration-200 ease-in'
    ]
  }),
  onicon: ({ props }) => ({
    class: [
      // Size
      'w-5 h-5',

      // Color
      'text-primary-500 dark:text-primary-400',

      // State
      { 'hover:text-primary-600 dark:hover:text-primary-300': !props.readonly },

      // Transition
      'transition duration-200 ease-in'
    ]
  })
}
