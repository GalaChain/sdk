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
import MintTokenWithAllowance from './MintTokenWithAllowance.vue'
import { plainToInstance } from "class-transformer";
import { TokenClass } from '@gala-chain/api';

const meta: Meta<typeof MintTokenWithAllowance> = {
  component: MintTokenWithAllowance
}

export default meta
type Story = StoryObj<typeof MintTokenWithAllowance>

const token = plainToInstance(TokenClass, {
  additionalKey: 'none',
  authorities: ['client|test'],
  category: 'Unit',
  collection: 'GALA',
  decimals: 8,
  description: 'GALA token',
  image: 'https://static.gala.games/images/icons/units/gala.png',
  isNonFungible: false,
  knownMintAllowanceSupply: '5000000000',
  knownMintSupply: '50000000000',
  maxCapacity: '50000000000',
  maxSupply: '50000000000',
  name: 'GALA',
  network: 'GC',
  symbol: 'GALA',
  totalBurned: '5000',
  totalMintAllowance: '50000000000',
  totalSupply: '50000000000',
  type: 'none'
})

const Template = (args) => ({
  components: { MintTokenWithAllowance },
  setup() {
    return { args }
  },
  methods: { submit: action('submit'), change: action('change') },
  template: '<MintTokenWithAllowance v-bind="args" @submit="submit" @change="change"/>'
})

export const Primary: Story = Template.bind({})
Primary.args = {
  token,
  address: 'client|test',
  loading: false,
  disabled: false
}

export const Fee: Story = Template.bind({})
Fee.args = {
  token,
  address: 'client|test',
  feeAmount: '1',
  loading: false,
  disabled: false
}

export const Empty: Story = Template.bind({})
Empty.args = {
  token: undefined,
  address: 'client|test',
  loading: false,
  disabled: false
}
