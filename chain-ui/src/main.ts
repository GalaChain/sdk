// import { defineCustomElement } from 'vue'
import PrimeVue from 'primevue/config'
// import Button from './components/Button.ce.vue'
import ActionButton from './components/ActionButton.ce.vue'
import './main.css'
import { defineCustomElement as defineCustomElementWithOptions } from './utils/defineCustomElement'

// customElements.define('gala-button', defineCustomElement(Button))
customElements.define(
  'gala-action-button',
  defineCustomElementWithOptions(ActionButton, { plugins: [PrimeVue] })
)
