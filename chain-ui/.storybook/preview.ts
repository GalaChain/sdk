import { Preview, setup } from '@storybook/vue3'
import PrimeVue from 'primevue/config'
import primevueTheme from '../src/theme/primevue/gala'

setup((app) => {
  app.use(PrimeVue, { pt: primevueTheme })
})

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'dark'
    }
  }
}

export default preview
