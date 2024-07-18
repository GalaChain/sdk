/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
