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
  plugins?: Plugin[]
}

export const defineCustomElement = (
  component: ReturnType<typeof defineComponent>,
  { includeStyles = true, plugins = [] }: IOptions
) =>
  VueDefineCustomElement({
    styles: includeStyles ? component.styles : undefined,
    render: () => h(component),
    setup() {
      const app = createApp(AppContainer)

      // install plugins
      plugins.forEach(app.use)

      const inst = getCurrentInstance() as
        | (ComponentInternalInstance & { provides: AppContext['provides'] })
        | null
      if (!inst) return
      Object.assign(inst.appContext, app._context)
      Object.assign(inst.provides, app._context.provides)
    }
  })
