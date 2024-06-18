// import { defineCustomElement } from 'vue'
import PrimeVue from 'primevue/config'
// import Button from './components/Button.ce.vue'
import ActionButton from './elements/ActionButton.ce.vue'
import './main.css'
import { defineCustomElement as defineCustomElementWithOptions } from './utils/defineCustomElement'
import primevueTheme from './theme/primevue/gala'
import TransferTokenCe from './elements/TransferToken.ce.vue'
import MintTokenWithAllowanceCe from './elements/MintTokenWithAllowance.ce.vue'
import MintTokenCe from './elements/MintToken.ce.vue'

customElements.define(
  'gala-action-button',
  defineCustomElementWithOptions(ActionButton, {
    plugins: [{ plugin: PrimeVue, options: { pt: primevueTheme } }]
  })
)

customElements.define(
  'gala-transfer-token',
  defineCustomElementWithOptions(TransferTokenCe, {
    plugins: [{ plugin: PrimeVue, options: { pt: primevueTheme } }]
  })
)

customElements.define(
  'gala-mint-token',
  defineCustomElementWithOptions(MintTokenCe, {
    plugins: [{ plugin: PrimeVue, options: { pt: primevueTheme } }]
  })
)

customElements.define(
  'gala-mint-token-with-allowance',
  defineCustomElementWithOptions(MintTokenWithAllowanceCe, {
    plugins: [{ plugin: PrimeVue, options: { pt: primevueTheme } }]
  })
)
