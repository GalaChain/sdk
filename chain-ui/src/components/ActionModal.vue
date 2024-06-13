<script lang="ts" setup>
import PrimeDialog from 'primevue/dialog'
import PrimeButton from 'primevue/button'
import PrimeInputText from 'primevue/inputText'

defineProps<{
  header?: string
}>()
const visible = defineModel('visible', { default: false })
</script>

<template>
  <PrimeDialog
    v-model:visible="visible"
    modal
    :header="header || 'Edit Profile'"
    :pt="{
      root: 'w-full max-w-md',
    }"
  >
    <p class="text-white/60 text-sm mb-4">Update your information.</p>
    <div class="flex flex-col gap-1.5 mb-3 text-sm">
      <label class="font-semibold" for="username">Username</label>
      <PrimeInputText
        id="username"
        autocomplete="off"
      />
    </div>
    <div class="flex flex-col align-items-center gap-1.5 mb-5">
      <label for="email" class="font-semibold">Email</label>
      <PrimeInputText
        id="email"
        autocomplete="off"
      />
    </div>
    <div class="flex justify-end gap-2">
      <PrimeButton
        rounded
        type="button"
        label="Save"
        @click="visible = false"
      ></PrimeButton>
      <PrimeButton
        rounded
        type="button"
        label="Cancel"
        severity="secondary"
        @click="visible = false"
      ></PrimeButton>
    </div>
  </PrimeDialog>
</template>
