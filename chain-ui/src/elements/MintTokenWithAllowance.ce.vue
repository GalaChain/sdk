<script lang="ts" setup>
  import { computed, ref } from 'vue';
  import { TransferTokenDto, TokenClass } from '@gala-chain/api/src/types' 
  import GalaSend from '../components/Send.vue';
  import type { TokenAllowance } from '@gala-chain/api';
  import { calculateAvailableMintAllowances } from '../utils/calculateBalance';

  const props = defineProps({
    address: String
  })

  const tokens: {token: TokenClass, allowances: TokenAllowance []}[] = [
      {
        allowances: [{
          additionalKey: "none",
          allowanceType: 4,
          category: "Unit",
          collection: "GALA",
          created: 1718655547156,
          expires: 0,
          grantedBy: "client|ops-admin",
          grantedTo: "client|63580d94c574ad78b121c267",
          instance: "0",
          quantity: "1000",
          quantitySpent: "1",
          type: "none",
          uses: "1000",
          usesSpent: "1"
        }],
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
      available: calculateAvailableMintAllowances(token.allowances).toString()
    })))

  const submit = (payload: TransferTokenDto) => {
    console.log(payload);
  } 
</script>

<template>
  <GalaSend :tokens="availableTokens" @submit="submit" to-header="Mint to" submit-text="Mint"></GalaSend>
</template>

<style>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>