import { defineCustomElement } from 'vue'
import Button from './components/Button.ce.vue'
import './main.css'

customElements.define('gala-button', defineCustomElement(Button))
