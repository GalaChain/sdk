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
    image: 'https://app.gala.games/_nuxt/img/GALA-icon.b642e24.png',
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
  methods: { submit: action('submit') },
  template: '<TransferToken v-bind="args" @submit="submit"/>'
})

export const Primary: Story = Template.bind({})
Primary.args = {
  tokenBalance,
  loading: false,
  disabled: false
}

export const Empty: Story = Template.bind({})
Empty.args = {
  tokenBalance: undefined,
  loading: false,
  disabled: false
}