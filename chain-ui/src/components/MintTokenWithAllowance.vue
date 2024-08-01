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
import { TokenClass, MintTokenWithAllowanceDto, TransferTokenDto } from '@gala-chain/api'
import GalaSend, { type TokenClassBalance } from '@/components/common/Send.vue'
import { calculateAvailableMintSupply } from '@/utils/calculateBalance'
import type { IGalaChainError } from '@/types/galachain-error'
import PrimeSkeleton from 'primevue/skeleton'

export interface MintTokenWithAllowanceProps {
  address?: string
  token?: TokenClass
  loading?: boolean
}

const props = defineProps<MintTokenWithAllowanceProps>()

const emit = defineEmits<{
  submit: [value: MintTokenWithAllowanceDto]
  error: [value: IGalaChainError]
}>()

const availableToken = computed(() => {
  const token: TokenClass = typeof props.token === 'string' ? JSON.parse(props.token) : props.token
  return token
    ? ({
        ...token,
        available: calculateAvailableMintSupply(token, props.address).toString()
      } as TokenClassBalance)
    : undefined
})

const submit = (payload: TransferTokenDto) => {
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
  } as MintTokenWithAllowanceDto
  emit('submit', mintTokenWithAllowanceDto)
}
</script>

<template>
  <GalaSend
    v-if="availableToken"
    :token="availableToken"
    :loading="loading"
    to-header="Mint to"
    submit-text="Mint"
    :from-address="address"
    @submit="submit"
    @error="(event) => emit('error', event)"
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
