import { defineCustomElement } from 'vue'
import Button from './components/Button.vue'

customElements.define('gala-button', defineCustomElement(Button))
