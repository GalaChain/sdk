<script lang="ts" setup>
import { computed } from 'vue'
import { TokenClass, MintTokenDto, TransferTokenDto } from '@gala-chain/api'
import GalaSend, { type TokenClassBalance } from '@/components/common/Send.vue'
import { TokenAllowance } from '@gala-chain/api'
import { calculateAvailableMintAllowances } from '@/utils/calculateBalance'
import type { IGalaChainError } from '../types/galachain-error'
import PrimeSkeleton from 'primevue/skeleton'

export interface MintTokenProps {
  tokenAllowance?: { token: TokenClass; allowances: TokenAllowance[] }
  loading?: boolean
}

const props = defineProps<MintTokenProps>()

const emit = defineEmits<{
  submit: [value: MintTokenDto]
  error: [value: IGalaChainError]
}>()

const availableToken = computed(() => {
  const token: { token: TokenClass; allowances: TokenAllowance[] } =
    typeof props.tokenAllowance === 'string'
      ? JSON.parse(props.tokenAllowance)
      : props.tokenAllowance
  return token
    ? ({
        ...token.token,
        available: calculateAvailableMintAllowances(token.allowances).toString()
      } as TokenClassBalance)
    : undefined
})

const submit = (payload: TransferTokenDto) => {
  const { quantity, tokenInstance } = payload
  const { collection, category, type, additionalKey } = tokenInstance
  const mintTokenDto = {
    quantity,
    tokenClass: {
      collection,
      category,
      type,
      additionalKey
    }
  } as MintTokenDto
  emit('submit', mintTokenDto)
}
</script>

<template>
  <GalaSend
    v-if="availableToken"
    :token="availableToken"
    :loading="loading"
    :show-recipient="false"
    @submit="submit"
    @error="(event) => emit('error', event)"
    to-header="Mint to"
    submit-text="Mint"
  >
  </GalaSend>
  <slot v-else name="empty">
    <div class="flex flex-col items-center mt-6">
      <div class="flex items-center w-full mb-6">
        <PrimeSkeleton shape="circle" size="8rem" class="shrink-0 mr-4"></PrimeSkeleton>
        <PrimeSkeleton height="3.5rem"></PrimeSkeleton>
      </div>
      <PrimeSkeleton height="3.5rem" width="10rem" border-radius="2rem"></PrimeSkeleton>
    </div>
  </slot>
</template>

<style lang="css">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
