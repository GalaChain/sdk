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

import type { Meta, StoryObj } from '@storybook/vue3'
import { action } from '@storybook/addon-actions'
import MintToken from './MintToken.vue'

const meta: Meta<typeof MintToken> = {
  component: MintToken
}

export default meta
type Story = StoryObj<typeof MintToken>

const tokenAllowance = {
  token: {
    additionalKey: 'none',
    authorities: [],
    category: 'Unit',
    collection: 'GALA',
    decimals: 8,
    description: 'GALA token',
    image: 'https://static.gala.games/images/icons/units/gala.png',
    isNonFungible: false,
    maxCapacity: '50000000000',
    maxSupply: '50000000000',
    name: 'GALA',
    network: 'GC',
    symbol: 'GALA',
    totalBurned: '0',
    totalMintAllowance: '0',
    totalSupply: '50000000000',
    type: 'none'
  },
  allowances: [
    {
      additionalKey: 'none',
      allowanceType: 4,
      category: 'Unit',
      collection: 'GALA',
      created: 1719413534107,
      expires: 0,
      grantedBy: '',
      grantedTo: '',
      instance: '0',
      quantity: '1000',
      quantitySpent: '0',
      type: 'none',
      uses: '1000',
      usesSpent: '0'
    }
  ]
}

const Template = (args) => ({
  components: { MintToken },
  setup() {
    return { args }
  },
  methods: { submit: action('submit'), change: action('change') },
  template: '<MintToken v-bind="args" @submit="submit" @change="change"/>'
})

export const Primary: Story = Template.bind({})
Primary.args = {
  tokenAllowance,
  loading: false,
  disabled: false
}

export const Fee: Story = Template.bind({})
Fee.args = {
  tokenAllowance,
  feeAmount: '1',
  loading: false,
  disabled: false
}

export const Empty: Story = Template.bind({})
Empty.args = {
  tokenAllowance: undefined,
  loading: false,
  disabled: false
}
