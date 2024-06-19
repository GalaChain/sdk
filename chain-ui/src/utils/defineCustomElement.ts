import {
  defineCustomElement as VueDefineCustomElement,
  h,
  createApp,
  defineComponent,
  getCurrentInstance,
  type AppContext,
  type ComponentInternalInstance,
  type Plugin
} from 'vue'
import AppContainer from '@/components/AppContainer.vue'

interface IOptions {
  includeStyles?: boolean
  plugins?: { plugin: Plugin; options: any }[]
}

export const defineCustomElement = (
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
  })
