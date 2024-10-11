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
import { ref, computed, watch } from 'vue'
import { type ValidationArgs, useVuelidate } from '@vuelidate/core'
import { helpers, required, minValue, maxValue } from '@vuelidate/validators'
import { getStepSizeFromDecimals } from '@/utils/validation'
import { TransferTokenDto, TokenClass } from '@gala-chain/api'
import { type IGalaChainError } from '@/types/galachain-error'
import FormInput from '../Form/Input.vue'
import FormErrors from '../Form/Errors.vue'
import PrimeButton from 'primevue/button'
import BigNumber from 'bignumber.js'
import { plainToInstance } from 'class-transformer'

export interface TokenClassBalance extends TokenClass {
  available: string
}

interface IFormModel {
  token: TokenClassBalance
  quantity: string
  recipient: string
}

const props = withDefaults(
  defineProps<{
    token: TokenClassBalance
    walletAddress?: string
    disabled?: boolean
    loading?: boolean
    showRecipient?: boolean
    recipientHeader?: string
    recipientPlaceholder?: string
    submitText?: string
    feeAmount?: string
    feeCurrency?: string
    rules?: ValidationArgs<Partial<IFormModel>>
    error?: IGalaChainError
  }>(),
  {
    disabled: false,
    showRecipient: true,
    recipientHeader: 'To',
    recipientPlaceholder: 'client|000000000000000000000000',
    submitText: 'Submit',
    feeCurrency: 'GALA',
    rules: undefined,
    error: undefined
  }
)

const recipient = defineModel<string>('recipient')
const quantity = defineModel<string>('quantity')

const emit = defineEmits<{
  submit: [value: TransferTokenDto]
  error: [value: IGalaChainError]
  change: [value: TransferTokenDto]
}>()

const formEl = ref<HTMLFormElement>()

const maxAvailable = computed(() => new BigNumber(props.token?.available ?? 0))
const validationRules = computed(() => {
  if (props.rules) {
    return props.rules
  }

  const rules: ValidationArgs<Partial<IFormModel>> = {
    quantity: {
      required,
      min: minValue(
        props.token?.decimals ? getStepSizeFromDecimals(props.token.decimals).toNumber() : 1
      ),
      max:
        !maxAvailable.value || maxAvailable.value.eq(0) || maxAvailable.value.isNaN()
          ? helpers.withMessage(`You do not have any ${props.token?.symbol}`, maxValue(0))
          : maxValue(maxAvailable.value.toNumber())
    },
    token: {
      required
    }
  }
  if (props.showRecipient) {
    rules.recipient = {
      required: helpers.withMessage('A valid wallet address is required', required)
    }
  }

  return rules
})

const validationModel = computed(() => ({
  recipient: recipient.value,
  token: props.token,
  quantity: quantity.value
}))
const v$ = useVuelidate<Partial<IFormModel>>(validationRules, validationModel)

const globalError = computed(() =>
  props.error
    ? props.error.message
    : v$.value.$error && v$.value.$dirty
      ? 'Please fix all errors before submitting'
      : ''
)

const send = async () => {
  await v$.value.$validate()
  if (v$.value.$error) {
    return
  }

  const { collection, category, type, additionalKey } = props.token!
  emit(
    'submit',
    plainToInstance(TransferTokenDto, {
      quantity: quantity.value,
      recipient: recipient.value,
      tokenInstance: {
        instance: '0',
        collection,
        category,
        type,
        additionalKey
      }
    })
  )
}

watch(
  () => props.token,
  () => {
    quantity.value = '0'
  },
  { immediate: true }
)

watch([recipient, quantity], () => {
  const { collection, category, type, additionalKey } = props.token!
  emit(
    'change',
    plainToInstance(TransferTokenDto, {
      quantity: quantity.value,
      recipient: recipient.value,
      tokenInstance: {
        instance: '0',
        collection,
        category,
        type,
        additionalKey
      }
    })
  )
})
</script>

<template>
  <form ref="formEl" v-uid @submit.prevent="send" class="dark:text-white">
    <div class="xs:flex xs:gap-4 mt-6 mb-6">
      <div class="px-2 flex-grow-0 flex-shrink-0 text-center">
        <img
          v-if="props.token?.image"
          :src="props.token.image"
          :alt="props.token.name"
          width="128"
          height="128"
          class="w-24 h-24 xs:w-32 xs:h-32 rounded-md mx-auto"
        />
        <div
          v-else
          class="w-24 h-24 xs:w-32 xs:h-32 rounded-full mx-auto bg-surface-200 dark:bg-surface-850"
        ></div>
      </div>

      <div class="px-2 xs:pl-0 xs:text-left flex-grow mt-4 xs:mt-3">
        <div v-if="!!props.token">
          <label :for="`${formEl?.id}-send-token`" class="sr-only"> Token </label>
          <input
            :id="`${formEl?.id}-send-token`"
            :value="props.token.name"
            readonly
            type="hidden"
            class=""
          />
          <p class="font-semibold text-center text-lg xs:text-left">
            {{ props.token.name }}
          </p>
        </div>

        <FormInput
          v-model="quantity"
          label="Amount"
          type="number"
          name="quantity"
          :step="
            props.token?.decimals ? getStepSizeFromDecimals(props.token.decimals).toString() : '1'
          "
          :aria-describedby="`${formEl?.id}-max-quantity`"
          class="form-element-quantity text-left"
          placeholder="0.0"
          :errors="
            v$.quantity.$error && v$.quantity.$errors[0]?.$message
              ? [v$.quantity.$errors[0].$message]
              : undefined
          "
          @change="v$.quantity.$touch"
        >
          <template #prefix>
            <div
              v-if="maxAvailable && !maxAvailable.eq(0)"
              class="flex justify-end relative top-5 translate-y-full pr-3 h-0"
            >
              <button
                type="button"
                class="h-8 bg-surface-50 dark:bg-surface-925 text-surface-secondary hocus:text-surface-primary transition-colors duration-150 px-2.5 py-1.5 text-sm font-semibold rounded-md focus-visible:focus-ring"
                @click="quantity = maxAvailable.toString()"
              >
                Max
              </button>
            </div>
          </template>
        </FormInput>
        <div
          v-if="maxAvailable && !(v$.quantity.$error && v$.quantity.$errors[0]?.$message)"
          :id="`${formEl?.id}-max-quantity`"
          class="mt-2"
        >
          <p class="text-surface-secondary text-xs">Available: {{ maxAvailable }}</p>
        </div>
      </div>
    </div>
    <div v-if="showRecipient" class="px-2 mb-6">
      <FormInput
        v-model.trim="recipient"
        :label="recipientHeader"
        :placeholder="recipientPlaceholder"
        type="text"
        name="recipient"
        class="form-element-to text-left"
        :errors="
          v$.recipient.$error && v$.recipient.$errors[0]?.$message
            ? [v$.recipient.$errors[0].$message]
            : undefined
        "
        @change="v$.recipient.$touch"
      >
        <template #prefix>
          <button
            v-if="walletAddress"
            type="button"
            class="float-right text-primary-500 font-semibold transition-colors duration-150 rounded-md hover:text-surface-primary focus-visible:focus-ring"
            aria-label="set recipient to my wallet address"
            @click="recipient = walletAddress"
          >
            My Wallet
          </button>
        </template>
      </FormInput>
    </div>
    <Transition name="slide-fade">
      <div v-if="feeAmount" class="overflow-hidden">
        <div class="bg-surface-200 dark:bg-surface-850 rounded-xl px-4 py-2 mb-6 mx-2 flex">
          <span class="mr-auto">Fee:</span>
          <span>{{ feeAmount }} {{ feeCurrency ?? 'GALA' }}</span>
        </div>
      </div>
    </Transition>
    <div v-if="globalError">
      <div class="bg-red-400 dark:bg-red-900 text-surface-primary px-4 py-2 rounded-lg mx-2 mb-4">
        <FormErrors
          class="text-surface-primary justify-center"
          color="text-white"
          :errors="[globalError]"
        />
      </div>
    </div>
    <div class="flex flex-col items-stretch xs:items-center justify-center">
      <PrimeButton
        severity="contrast"
        rounded
        :label="submitText"
        type="submit"
        size="large"
        :disabled="disabled"
        :loading="loading"
      >
        <slot name="submit" :label="submitText"></slot>
      </PrimeButton>
    </div>
  </form>
</template>

<style scoped>
.form-element-to {
  :deep() {
    label {
      @apply inline-block;
    }
  }
  .user-wallet-address-btn {
    @apply inline-block float-right;
  }
}

.slide-fade-leave-active,
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
  max-height: 100px;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  max-height: 0px;
}
</style>
