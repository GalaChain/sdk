<script lang="ts" setup>
  import { computed } from 'vue';
  import { TransferTokenDto, TokenClass } from '@gala-chain/api' 
  import GalaSend, { type TokenClassBalance } from '@/components/Send.vue';
import { calculateAvailableMintSupply } from '@/utils/calculateBalance';
import type { IGalaChainError } from '@/types/galachain-error';

  const props = defineProps({
    address: String
  })

  const emit = defineEmits<{
    submit: [value: TransferTokenDto];
    error: [value: IGalaChainError];
  }>();

  const tokens: { token: TokenClass }[] = [
    {
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
        type: 'none',
        knownMintAllowanceSupply: "5760597134.02388959",
        knownMintSupply: "12557871753.41399767",
      },
    }
  ];

  const availableTokens = computed(() => tokens.map(token => ({
    ...token.token, 
    available: calculateAvailableMintSupply(token.token).toString()
  } as TokenClassBalance)))
</script>

<template>
  <GalaSend 
    :tokens="availableTokens" 
    to-header="Mint to" 
    submit-text="Mint"
    @submit="event => emit('submit', event)" 
    @error="event => emit('error', event)" 
  ></GalaSend>
</template>

<style>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>../types/galachainError