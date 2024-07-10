<script lang="ts" setup>
import { MinusIcon, PlusIcon } from '@heroicons/vue/20/solid'
import { computed, ref } from 'vue'
import type {
  IFieldProps,
  IInputProps,
  INumberInputProps,
  IPasswordInputProps,
  ITextAreaInputProps
} from '../../types/input'
import FormErrors from './Errors.vue'
import PrimePassword from 'primevue/password'
import PrimeTextarea from 'primevue/textarea'
import PrimeInputText from 'primevue/inputText'

const props = defineProps<
  IFieldProps & (IInputProps | INumberInputProps | IPasswordInputProps | ITextAreaInputProps)
>()

const emit = defineEmits<{
  focus: [e: FocusEvent]
  blur: [e: FocusEvent]
}>()

const model = defineModel<string | number>({
  default: ''
})

const container = ref<HTMLDivElement>()
const touched = ref(false)
const isFocused = ref(false)
const ariaDescribedByNormalized = computed(() =>
  !props.ariaDescribedby
    ? []
    : Array.isArray(props.ariaDescribedby)
      ? props.ariaDescribedby
      : [props.ariaDescribedby]
)
const shouldShowNumberControls = computed(() => {
  return (
    props.labelStyle !== 'floating' &&
    props.type === 'number' &&
    (props as INumberInputProps).controls
  )
})

const inputClass = computed(() => {
  const { inputClass } = props
  if (!inputClass) {
    return 'w-full'
  } else {
    return typeof inputClass === 'string'
      ? `${inputClass} w-full`
      : { ...inputClass, 'w-full': true }
  }
})

const inputProps = computed(() => {
  const { autocomplete, name, placeholder, readonly, required, type } = props
  const baseProps = {
    autocomplete,
    name,
    placeholder,
    readonly,
    required,
    type
  }

  if (type === 'password') {
    return {
      ...baseProps,
      feedback: (props as IPasswordInputProps).feedback,
      toggleMask: (props as IPasswordInputProps).toggleMask
    }
  }
  if (type === 'number') {
    return {
      ...baseProps,
      max: !shouldShowNumberControls.value ? (props as INumberInputProps).max : undefined,
      min: !shouldShowNumberControls.value ? (props as INumberInputProps).min : undefined,
      step: (props as INumberInputProps).step
    }
  }
  if (type === 'textarea') {
    return {
      ...baseProps,
      autoResize: (props as ITextAreaInputProps).autoResize,
      rows: (props as ITextAreaInputProps).rows
    }
  }

  return baseProps
})

const handleFocus = (e: FocusEvent) => {
  isFocused.value = true
  emit('focus', e)
}

const handleBlur = (e: FocusEvent) => {
  isFocused.value = false
  if (!touched.value) {
    touched.value = true
  }
  if (props.type === 'number' && model.value === '') {
    // a number input's parsed value is an empty string when it contains an invalid number format,
    // so there may still be text in the input. set to empty string to clear it.
    if (e.target) {
      ;(e.target as HTMLInputElement).value = ''
    }
  }
  emit('blur', e)
}

const handleDecrement = (e: Event) => {
  e.preventDefault()
  const startValue = isNaN(+model.value) ? 0 : +model.value
  const { min, step } = props as INumberInputProps
  const newValue = startValue - (step ? parseFloat(step) : 1)
  model.value = min !== undefined ? Math.max(newValue, min) : newValue
}

const handleIncrement = (e: Event) => {
  e.preventDefault()
  const startValue = isNaN(+model.value) ? 0 : +model.value
  const { max, step } = props as INumberInputProps
  const newValue = startValue + (step ? parseFloat(step) : 1)
  model.value = max !== undefined ? Math.min(newValue, max) : newValue
}

const getAriaDescribedBy = (id?: string) => {
  const value = [...ariaDescribedByNormalized.value]
  if (id) {
    if (props.prefix) {
      value.push(`${id}-prefix`)
    }
    if (props.hint) {
      value.push(`${id}-hint`)
    }
    if (props.errors?.length) {
      value.push(`${id}-errors`)
    }
  }
  return value.length ? value.join(' ') : undefined
}
</script>

<template>
  <div
    ref="container"
    v-uid
    class="gc-form-input"
    :class="{
      'floating-label': props.labelStyle === 'floating',
      'is-filled': model || (type === 'number' && model === 0),
      'is-focused': isFocused,
      'with-number-controls': shouldShowNumberControls
    }"
  >
    <div class="relative">
      <label
        :for="`${container?.id}-input`"
        class="font-medium leading-6"
        :class="{
          'sr-only': labelStyle === 'hidden',
          'text-sm': labelStyle === 'floating' || labelSize === 'sm',
          'text-lg': labelStyle !== 'floating' && labelSize === 'lg',
          'text-xl': labelStyle !== 'floating' && labelSize === 'xl'
        }"
        ><slot name="label" :label="label">{{ label }}</slot></label
      >
      <slot
        name="prefix"
        :prefix="prefix"
        :attrs="{
          id: `${container?.id}-prefix`,
          class: 'prefix mb-2 text-sm text-surface-secondary'
        }"
      >
        <p
          v-if="prefix"
          :id="`${container?.id}-prefix`"
          class="prefix my-2 text-sm text-surface-secondary"
        >
          {{ prefix }}
        </p>
      </slot>
      <div
        class="input-container"
        :class="{
          'mt-2': !labelStyle,
          relative: shouldShowNumberControls
        }"
      >
        <PrimePassword
          v-if="type === 'password' && typeof model === 'string'"
          v-model="model"
          :input-id="`${container?.id}-input`"
          :input-props="{
            'aria-describedby': getAriaDescribedBy(container?.id)
          }"
          :disabled="disabled"
          :input-class="inputClass"
          :invalid="!!errors?.length"
          class="w-full"
          v-bind="inputProps"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <PrimeTextarea
          v-else-if="type === 'textarea' && typeof model === 'string'"
          v-model="model"
          :input-props="{
            'aria-describedby': getAriaDescribedBy(container?.id)
          }"
          :disabled="disabled"
          :invalid="!!errors?.length"
          :pt="{
            root: {
              class: inputClass
            }
          }"
          :pt-options="{
            mergeProps: true
          }"
          v-bind="inputProps"
          @focus="handleFocus"
          @blur="handleBlur"
        />
        <template v-else>
          <!-- todo fix number buttons if necessary, use default from primevue? -->
          <template>
            <button
              type="button"
              :aria-label="`decrease by ${(inputProps as INumberInputProps).step ?? 1}`"
              class="num-control dec"
              @click="handleDecrement"
            >
              <MinusIcon class="w-5 h-5 mx-auto" />
            </button>
          </template>
          <PrimeInputText
            v-bind="inputProps"
            :id="`${container?.id}-input`"
            v-model="model"
            :class="inputClass"
            :disabled="disabled"
            :invalid="!!errors?.length"
            :aria-describedby="getAriaDescribedBy(container?.id)"
            @focus="handleFocus"
            @blur="handleBlur"
          />
          <template v-if="type === 'number' && shouldShowNumberControls">
            <button
              type="button"
              :aria-label="`increase by ${(inputProps as INumberInputProps).step ?? 1}`"
              class="num-control inc"
              @click="handleIncrement"
            >
              <PlusIcon class="w-5 h-5 mx-auto" />
            </button>
          </template>
        </template>
      </div>
    </div>
    <slot name="hint" :hint="hint">
      <p v-if="hint" :id="`${container?.id}-hint`" class="mt-2 text-sm text-surface-secondary">
        {{ hint }}
      </p>
    </slot>
    <slot name="errors" :errors="errors" :touched="touched">
      <FormErrors
        v-if="errors?.length"
        :id="`${container?.id}-errors`"
        :errors="errors"
        class="mt-2"
      />
    </slot>
  </div>
</template>

<style>
.gc-form-input {
  &.with-number-controls {
    input {
      @apply text-center px-14 text-ellipsis;
    }
  }

  .num-control {
    @apply bg-surface-300 dark:bg-surface-750 text-surface-primary p-2 rounded-xl w-10 h-10 absolute top-1/2 -translate-y-1/2 focus-visible:focus-ring;
    &.dec {
      @apply left-2;
    }
    &.inc {
      @apply right-2;
    }
  }
}
</style>
