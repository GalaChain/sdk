<script lang="ts" setup>
import { computed } from 'vue';
import { TokenBalanceWithMetadata, TransferTokenDto } from '@gala-chain/api'
import GalaSend, { type TokenClassBalance } from '@/components/common/Send.vue';
import { calculateAvailableBalance } from '@/utils/calculateBalance';
import { TokenBalance } from '@gala-chain/api';
import type { IGalaChainError } from '@/types/galachain-error';
import PrimeSkeleton from 'primevue/skeleton';

  export interface TransferTokenProps {
    tokenBalance?: TokenBalanceWithMetadata,
    loading?: boolean,
    disabled?: boolean,
  }

  const props = defineProps<TransferTokenProps>()

  const emit = defineEmits<{
    submit: [value: TransferTokenDto];
    error: [value: IGalaChainError];
  }>()

  const availableToken = computed(() => {
    const token: TokenBalanceWithMetadata = typeof props.tokenBalance === 'string' ? JSON.parse(props.tokenBalance) : props.tokenBalance; 
    return token ? 
      {
        ...token.token,
        available: calculateAvailableBalance(token.balance as TokenBalance).toString()
      } as TokenClassBalance : 
      undefined;
  })
</script>

<template>
  <GalaSend 
    v-if="availableToken"
    :token="availableToken"
    :loading="loading"
    to-header="Send to"
    submit-text="Send"
    @submit="event => emit('submit', event as TransferTokenDto)" 
    @error="event => emit('error', event)" 
  ></GalaSend>
  <slot v-else name="empty">
    <div class="flex flex-col items-center mt-6">
      <div class="flex items-center w-full">
        <PrimeSkeleton shape="circle" size="8rem" class="shrink-0 mr-4"></PrimeSkeleton>
        <PrimeSkeleton height="3.5rem"></PrimeSkeleton>
      </div>
      <PrimeSkeleton height="3.5rem" class="my-6"></PrimeSkeleton>
      <PrimeSkeleton height="3.5rem" width="10rem" border-radius="2rem"></PrimeSkeleton>
    </div>
  </slot>
</template>