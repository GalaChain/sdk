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
import { computed } from 'vue'
import type { TokenClassBody, MintTokenWithAllowanceParams, TransferTokenParams } from '@gala-chain/api'
import GalaSend, { type TokenClassBalance } from '@/components/common/Send.vue'
import { calculateAvailableMintSupply } from '@/utils/calculateBalance'
import type { IGalaChainError } from '@/types/galachain-error'
import PrimeSkeleton from 'primevue/skeleton'

export interface MintTokenWithAllowanceProps {
  /** User address */
  address?: string
  /** Token class */
  token?: TokenClassBody
  /** Submit button loading state */
  loading?: boolean
  /** Submit button disabled state */
  disabled?: boolean
  /** Fee amount */
  feeAmount?: string
  /** Fee currency */
  feeCurrency?: string
}

export interface MintTokenWithAllowanceEmits {
  /** Fired when the form is successfully submitted */
  (event: 'submit', value: MintTokenWithAllowanceParams): void
  /** Fired when a form error occurs, does not include validation errors */
  (event: 'error', value: IGalaChainError): void
  /** Fired when the form is changed */
  (event: 'change', value: MintTokenWithAllowanceParams): void
}

const props = defineProps<MintTokenWithAllowanceProps>()
const emit = defineEmits<MintTokenWithAllowanceEmits>()

const availableToken = computed(() => {
  const token: TokenClassBody = typeof props.token === 'string' ? JSON.parse(props.token) : props.token
  return token
    ? ({
        ...token,
        available: calculateAvailableMintSupply(token, props.address).toString()
      } as TokenClassBalance)
    : undefined
})

const submit = (payload: TransferTokenParams) => {
  const { quantity, tokenInstance } = payload
  const { collection, category, type, additionalKey } = tokenInstance
  const mintTokenWithAllowanceDto = {
    quantity,
    tokenClass: {
      collection,
      category,
      type,
      additionalKey
    }
  } as MintTokenWithAllowanceParams
  emit('submit', mintTokenWithAllowanceDto)
}

const change = (payload: TransferTokenParams) => {
  const { quantity, tokenInstance } = payload
  const { collection, category, type, additionalKey } = tokenInstance
  const mintTokenWithAllowanceDto = {
    quantity,
    tokenClass: {
      collection,
      category,
      type,
      additionalKey
    }
  } as MintTokenWithAllowanceParams
  emit('change', mintTokenWithAllowanceDto)
}
</script>

<template>
  <GalaSend
    v-if="availableToken"
    :token="availableToken"
    :loading="loading"
    :disabled="disabled"
    :fee-amount="feeAmount"
    :fee-currency="feeCurrency"
    recipientHeader="Mint to"
    submit-text="Mint"
    :walletAddress="address"
    @submit="submit"
    @error="(event) => emit('error', event)"
    @change="change"
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
