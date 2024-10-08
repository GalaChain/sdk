<!--
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
 -->

<script lang="ts" setup>
import { computed, ref } from 'vue'
import type {
  TokenClassBody,
  MintTokenParams,
  TransferTokenParams,
  TokenAllowanceBody
} from '@gala-chain/api'
import GalaSend, { type TokenClassBalance } from '@/components/common/Send.vue'
import { calculateAvailableMintAllowances } from '@/utils/calculateBalance'
import type { IGalaChainError } from '../types/galachain-error'
import PrimeSkeleton from 'primevue/skeleton'

export interface MintTokenProps {
  /** Token allowance */
  tokenAllowance?: { token: TokenClassBody; allowances: TokenAllowanceBody[] }
  /** Submit button loading state */
  loading?: boolean
  /** Submit button disabled state */
  disabled?: boolean
  /** Fee amount */
  feeAmount?: string
  /** Fee currency */
  feeCurrency?: string
}

export interface MintTokenEmits {
  /** Fired when the form is successfully submitted */
  (event: 'submit', value: MintTokenParams): void
  /** Fired when a form error occurs, does not include validation errors */
  (event: 'error', value: IGalaChainError): void
  /** Fired when the form is changed */
  (event: 'change', value: MintTokenParams): void
}

const props = defineProps<MintTokenProps>()
const emit = defineEmits<MintTokenEmits>()

const availableToken = computed(() => {
  const token: { token: TokenClassBody; allowances: TokenAllowanceBody[] } =
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

const submit = (payload: TransferTokenParams) => {
  const { quantity, tokenInstance } = payload
  const { collection, category, type, additionalKey } = tokenInstance
  const mintTokenDto: MintTokenParams = {
    quantity,
    tokenClass: {
      collection,
      category,
      type,
      additionalKey
    }
  }
  emit('submit', mintTokenDto)
}

const change = (payload: TransferTokenParams) => {
  const { quantity, tokenInstance } = payload
  const { collection, category, type, additionalKey } = tokenInstance
  const mintTokenDto: MintTokenParams = {
    quantity,
    tokenClass: {
      collection,
      category,
      type,
      additionalKey
    }
  }
  emit('change', mintTokenDto)
}
</script>

<template>
  <GalaSend
    v-if="availableToken"
    :token="availableToken"
    :loading="loading"
    :show-recipient="false"
    :disabled="disabled"
    :fee-amount="feeAmount"
    :fee-currency="feeCurrency"
    @submit="submit"
    @error="(event) => emit('error', event)"
    @change="change"
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
