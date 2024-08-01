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

import {
  defineCustomElement as VueDefineCustomElement,
  h,
  createApp,
  defineComponent,
  getCurrentInstance,
  type AppContext,
  type ComponentInternalInstance,
  type Plugin,
  type VueElementConstructor
} from 'vue'
import AppContainer from '@/components/AppContainer.vue'

interface IOptions {
  includeStyles?: boolean
  plugins?: { plugin: Plugin; options: any }[]
}

export const defineCustomElement = <T>(
  component: ReturnType<typeof defineComponent>,
  { includeStyles = true, plugins = [] }: IOptions
) =>
  VueDefineCustomElement({
    styles: includeStyles ? component.styles : undefined,
    props: component.props,
    emits: component.emits,
    render: () => h(component),
    setup(props, { emit }) {
      const app = createApp(AppContainer)

      // install plugins
      plugins.forEach(({ plugin, options }) => app.use(plugin, options))

      const inst = getCurrentInstance() as
        | (ComponentInternalInstance & { provides: AppContext['provides'] })
        | null
      if (!inst) return
      Object.assign(inst.appContext, app._context)
      Object.assign(inst.provides, app._context.provides)

      const events = Object.fromEntries(
        (component.emits || []).map((event: string) => {
          return [
            `on${event[0].toUpperCase()}${event.slice(1)}`,
            (payload: unknown) => emit(event, payload)
          ]
        })
      )

      return () =>
        h(component, {
          ...props,
          ...events
        })
    }
  }) as VueElementConstructor<T>
