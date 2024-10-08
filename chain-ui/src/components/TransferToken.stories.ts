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
import TransferToken from './TransferToken.vue'

const meta: Meta<typeof TransferToken> = {
  component: TransferToken
}

export default meta
type Story = StoryObj<typeof TransferToken>

const tokenBalance = {
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
  balance: {
    additionalKey: 'none',
    category: 'Unit',
    collection: 'GALA',
    inUseHolds: [],
    instanceIds: [],
    lockedHolds: [],
    owner: '',
    quantity: '1000',
    type: 'none'
  }
}

const Template = (args) => ({
  components: { TransferToken },
  setup() {
    return { args }
  },
  methods: { submit: action('submit'), change: action('change') },
  template: '<TransferToken v-bind="args" @submit="submit" @change="change"/>'
})

export const Primary: Story = Template.bind({})
Primary.args = {
  tokenBalance,
  loading: false,
  disabled: false
}

export const Fee: Story = Template.bind({})
Fee.args = {
  tokenBalance,
  feeAmount: '1',
  loading: false,
  disabled: false
}

export const Empty: Story = Template.bind({})
Empty.args = {
  tokenBalance: undefined,
  loading: false,
  disabled: false
}
