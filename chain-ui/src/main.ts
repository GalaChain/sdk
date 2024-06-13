// import { defineCustomElement } from 'vue'
import PrimeVue from 'primevue/config'
// import Button from './components/Button.ce.vue'
import ActionButton from './components/ActionButton.ce.vue'
import Button from './components/Button.ce.vue'
import './main.css'
import { defineCustomElement as defineCustomElementWithOptions } from './utils/defineCustomElement'
import primevueTheme from './theme/primevue/gala'

customElements.define(
  'gala-button',
  defineCustomElementWithOptions(Button, {
    plugins: [{ plugin: PrimeVue, options: { pt: primevueTheme } }]
  })
)
customElements.define(
  'gala-action-button',
  defineCustomElementWithOptions(ActionButton, {
    plugins: [{ plugin: PrimeVue, options: { pt: primevueTheme } }]
  })
)
