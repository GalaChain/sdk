import type { Meta, StoryObj } from '@storybook/vue3'
import { action } from '@storybook/addon-actions'
import MintTokenWithAllowance from './MintTokenWithAllowance.vue'

const meta: Meta<typeof MintTokenWithAllowance> = {
  component: MintTokenWithAllowance
}

export default meta
type Story = StoryObj<typeof MintTokenWithAllowance>

const token = {
  additionalKey: 'none',
  authorities: ['client|test'],
  category: 'Unit',
  collection: 'GALA',
  decimals: 8,
  description: 'GALA token',
  image: 'https://app.gala.games/_nuxt/img/GALA-icon.b642e24.png',
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
}

const Template = (args) => ({
  components: { MintTokenWithAllowance },
  setup() {
    return { args }
  },
  methods: { submit: action('submit') },
  template: '<MintTokenWithAllowance v-bind="args" @submit="submit"/>'
})

export const Primary: Story = Template.bind({})
Primary.args = {
  token,
  address: 'client|test',
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
