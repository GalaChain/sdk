import PrimeVue from 'primevue/config'
import { type Component, type VueElementConstructor } from 'vue'
import { defineCustomElement } from '../utils/defineCustomElement'
import primevueTheme from '../theme/primevue/gala'
import TransferTokenComponent from '../elements/TransferToken.ce.vue'
import MintTokenComponent from '../elements/MintToken.ce.vue'
import MintTokenWithAllowanceComponent from '../elements/MintTokenWithAllowance.ce.vue'
import type { TransferTokenProps } from '../components/TransferToken.vue'
import type { MintTokenProps } from '../components/MintToken.vue'
import type { MintTokenWithAllowanceProps } from '../components/MintTokenWithAllowance.vue'

const defineCustomElementWithOptions = <T>(component: Component) => {
  // TODO change types so contructor param "initialProps" is typed to component props
  return defineCustomElement<T>(component, {
    plugins: [{ plugin: PrimeVue, options: { pt: primevueTheme } }]
  })
}

// TODO auto-construct from folder contents
const GalaTransferToken = defineCustomElementWithOptions<TransferTokenProps>(TransferTokenComponent)
const GalaMintToken = defineCustomElementWithOptions<MintTokenProps>(MintTokenComponent)
const GalaMintTokenWithAllowance = defineCustomElementWithOptions<MintTokenWithAllowanceProps>(
  MintTokenWithAllowanceComponent
)

const prefix = 'gala'
const galaChainElements: Record<string, VueElementConstructor> = {
  'transfer-token': GalaTransferToken,
  'mint-token': GalaMintToken,
  'mint-token-with-allowance': GalaMintTokenWithAllowance
}

Object.entries(galaChainElements).forEach(([key, value]) => {
  customElements.define(`${prefix}-${key}`, value)
})

export { GalaTransferToken, GalaMintToken, GalaMintTokenWithAllowance }
