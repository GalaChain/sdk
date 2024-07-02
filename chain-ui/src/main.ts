// import { defineCustomElement } from 'vue'
import PrimeVue from 'primevue/config'
// import Button from './components/Button.ce.vue'
import { defineCustomElement } from './utils/defineCustomElement'
import primevueTheme from './theme/primevue/gala'
import TransferToken from './elements/TransferToken.ce.vue'
import MintTokenWithAllowance from './elements/MintTokenWithAllowance.ce.vue'
import MintToken from './elements/MintToken.ce.vue'
import { type Component, type VueElementConstructor } from 'vue'

const defineCustomElementWithOptions = <T extends Component>(component: T) => {
  // TODO change types so contructor param "initialProps" is typed to component props
  return defineCustomElement(component, {
    plugins: [{ plugin: PrimeVue, options: { pt: primevueTheme } }]
  })
}

// TODO auto-construct from folder contents
const GalaTransferToken = defineCustomElementWithOptions(TransferToken)
const GalaMintToken = defineCustomElementWithOptions(MintToken)
const GalaMintTokenWithAllowance = defineCustomElementWithOptions(MintTokenWithAllowance)

const prefix = 'gala'
export const galaChainElements: Record<string, VueElementConstructor> = {
  'transfer-token': GalaTransferToken,
  'mint-token': GalaMintToken,
  'mint-token-with-allowance': GalaMintTokenWithAllowance
}

Object.entries(galaChainElements).forEach(([key, value]) => {
  customElements.define(`${prefix}-${key}`, value)
})

export { GalaTransferToken, GalaMintToken, GalaMintTokenWithAllowance }
