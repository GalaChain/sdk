<script lang="ts" setup>
import { reactive, ref, computed, watch } from 'vue'
import { type ValidationArgs, useVuelidate } from '@vuelidate/core'
import { helpers, required, minValue, maxValue } from '@vuelidate/validators'
import { getStepSizeFromDecimals } from '@/utils/validation'
import { TransferTokenDto, TokenClass } from '@gala-chain/api'
import { type IGalaChainError } from '@/types/galachain-error'
import FormInput from '../Form/Input.vue'
import FormErrors from '../Form/Errors.vue'
import PrimeButton from 'primevue/button'
import BigNumber from 'bignumber.js'

export interface TokenClassBalance extends TokenClass {
  available: string
}

interface IFormModel {
  token: TokenClassBalance
  quantity: number
  to: string
}

const props = withDefaults(
  defineProps<{
    token: TokenClassBalance
    disabled?: boolean
    loading?: boolean
    fromAddress?: string
    showRecipient?: boolean
    toHeader?: string
    toPlaceholder?: string
    submitText?: string
    rules?: ValidationArgs<Partial<IFormModel>>
    error?: IGalaChainError
  }>(),
  {
    disabled: false,
    showRecipient: true,
    toHeader: 'To',
    toPlaceholder: 'client|000000000000000000000000',
    submitText: 'Submit',
    rules: undefined,
    error: undefined
  }
)

const emit = defineEmits<{
  submit: [value: TransferTokenDto]
  error: [value: IGalaChainError]
}>()

const model = reactive<Partial<IFormModel>>({
  token: undefined,
  to: '',
  quantity: 1
})

const formEl = ref<HTMLFormElement>()

const maxAvailable = computed(() => new BigNumber(model.token?.available ?? 0))
const validationRules = computed(() => {
  if (props.rules) {
    return props.rules
  }

  const rules: ValidationArgs<Partial<IFormModel>> = {
    quantity: {
      required,
      min: minValue(
        model.token?.decimals ? getStepSizeFromDecimals(model.token.decimals).toNumber() : 1
      ),
      max:
        !maxAvailable.value || maxAvailable.value.eq(0) || maxAvailable.value.isNaN()
          ? helpers.withMessage(`You do not have any ${model.token?.symbol}`, maxValue(0))
          : maxValue(maxAvailable.value.toNumber())
    },
    token: {
      required
    }
  }
  if (props.showRecipient) {
    rules.to = {
      required: helpers.withMessage('A valid wallet address is required', required)
    }
  }

  return rules
})

const v$ = useVuelidate<Partial<IFormModel>>(validationRules, model as Partial<IFormModel>)

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

  const { token, to, quantity } = model
  const { collection, category, type, additionalKey } = token!
  emit('submit', {
    quantity,
    to,
    tokenInstance: {
      instance: '0',
      collection,
      category,
      type,
      additionalKey
    }
  } as unknown as TransferTokenDto)
}

watch(
  () => props.token,
  (current) => {
    model.token = current
    model.quantity = 0
  },
  { immediate: true }
)
</script>

<template>
  <form ref="formEl" v-uid @submit.prevent="send">
    <div class="xs:flex xs:gap-4 mt-6 mb-6">
      <div class="px-2 flex-grow-0 flex-shrink-0 text-center">
        <img
          v-if="model.token?.image"
          :src="model.token.image"
          :alt="model.token.name"
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
        <div v-if="!!model.token">
          <label :for="`${formEl?.id}-send-token`" class="sr-only"> Token </label>
          <input
            :id="`${formEl?.id}-send-token`"
            :value="model.token.name"
            readonly
            type="hidden"
            class=""
          />
          <p class="font-semibold text-center text-lg xs:text-left">
            {{ model.token.name }}
          </p>
        </div>

        <FormInput
          v-model="model.quantity"
          label="Amount"
          type="number"
          name="quantity"
          :step="
            model.token?.decimals ? getStepSizeFromDecimals(model.token.decimals).toString() : '1'
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
                @click="model.quantity = +maxAvailable"
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
        v-model.trim="model.to"
        :label="toHeader"
        :placeholder="toPlaceholder"
        type="text"
        name="to"
        class="form-element-to text-left"
        :errors="
          v$.to.$error && v$.to.$errors[0]?.$message ? [v$.to.$errors[0].$message] : undefined
        "
        @change="v$.to.$touch"
      >
        <template #prefix>
          <button
            v-if="fromAddress"
            type="button"
            class="float-right text-primary-500 font-semibold transition-colors duration-150 rounded-md hover:text-surface-primary focus-visible:focus-ring"
            aria-label="set recipient to my wallet address"
            @click="model.to = fromAddress"
          >
            My Wallet
          </button>
        </template>
      </FormInput>
    </div>
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
</style>
