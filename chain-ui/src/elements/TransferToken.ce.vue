<script lang="ts" setup>
  import { computed } from 'vue';
  import { TransferTokenDto } from '@gala-chain/api' 
  import GalaSend, { type TokenClassBalance } from '@/components/Send.vue';
  import { calculateAvailableBalance } from '@/utils/calculateBalance';
import type { TokenBalance, TokenClass } from '@gala-chain/api';
import type { IGalaChainError } from '@/types/galachain-error';

  const props = defineProps({
    address: String
  })

  const emit = defineEmits<{
    submit: [value: TransferTokenDto];
    error: [value: IGalaChainError];
  }>()

  const tokens: {token: TokenClass, balance: TokenBalance}[] = [
      {
        balance: {
          additionalKey: 'none',
          category: 'Unit',
          collection: 'GALA',
          owner: 'client|000000000000000000000000',
          quantity: '74543.25694633',
          type: 'none'
        },
        token: {
          additionalKey: 'none',
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
          totalSupply: '12587861171.99876767',
          type: 'none'
        },
      }
    ];

  const availableTokens = computed(() => tokens.map(token => ({
    ...token.token, 
    available: calculateAvailableBalance(token.balance).toString()
  } as TokenClassBalance)))
 
</script>

<template>
  <GalaSend 
    :tokens="availableTokens"
    to-header="Send to"
    submit-text="Send"
    @submit="event => emit('submit', event)" 
    @error="event => emit('error', event)" 
  ></GalaSend>
</template>

<style>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>../types/galachainError