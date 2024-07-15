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

const Template = (args, { argTypes }) => ({
  components: { MintToken },
  setup() {
    return { args }
  },
  methods: { submit: action('submit') },
  template: '<MintToken v-bind="args" @submit="submit"/>'
})

export const Primary: Story = Template.bind({})
Primary.args = {
  tokenAllowance,
  loading: false,
  disabled: false
}

export const Empty: Story = Template.bind({})
Empty.args = {
  tokenAllowance: undefined,
  loading: false,
  disabled: false
}
