import { setup } from '@storybook/vue3'
import PrimeVue from 'primevue/config'
import { GalaTransferToken, GalaMintToken, GalaMintTokenWithAllowance } from '../src/index'
import primevueTheme from '../src/theme/primevue/gala'

setup((app) => {
  app.use(PrimeVue, { pt: primevueTheme })
  app.component('gala-transfer-token', GalaTransferToken)
})
