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
      // Flex and Position
      'flex relative',
      { 'justify-center': props.layout == 'vertical' },
      { 'items-center': props.layout == 'vertical' },
      {
        'justify-start': props?.align == 'left' && props.layout == 'horizontal',
        'justify-center': props?.align == 'center' && props.layout == 'horizontal',
        'justify-end': props?.align == 'right' && props.layout == 'horizontal',
        'items-center': props?.align == 'top' && props.layout == 'vertical',
        'items-start': props?.align == 'center' && props.layout == 'vertical',
        'items-end': props?.align == 'bottom' && props.layout == 'vertical'
      },

      // Spacing
      {
        'my-5 mx-0 py-0 px-5': props.layout == 'horizontal',
        'mx-4 md:mx-5 py-5': props.layout == 'vertical'
      },

      // Size
      {
        'w-full': props.layout == 'horizontal',
        'min-h-full': props.layout == 'vertical'
      },

      // Before: Line
      'before:block',

      // Position
      {
        'before:absolute before:left-0 before:top-1/2': props.layout == 'horizontal',
        'before:absolute before:left-1/2 before:top-0 before:transform before:-translate-x-1/2':
          props.layout == 'vertical'
      },

      // Size
      {
        'before:w-full': props.layout == 'horizontal',
        'before:min-h-full': props.layout == 'vertical'
      },

      // Shape
      {
        'before:border-solid': props.type == 'solid',
        'before:border-dotted': props.type == 'dotted',
        'before:border-dashed': props.type == 'dashed'
      },

      // Color
      {
        'before:border-t before:border-surface-200 before:dark:border-surface-600':
          props.layout == 'horizontal',
        'before:border-l before:border-surface-200 before:dark:border-surface-600':
          props.layout == 'vertical'
      }
    ]
  }),
  content: {
    class: [
      // Space and Position
      'px-1 z-10',

      // Color
      'bg-surface-0 dark:bg-surface-800'
    ]
  }
}
