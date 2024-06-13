<script lang="ts" setup>
import PrimeDialog from 'primevue/dialog'
import PrimeButton from 'primevue/button'

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
      root: 'bg-black text-white shadow-lg p-6 rounded-lg w-full max-w-md',
      header: 'flex items-center justify-between mb-4',
      title: 'font-semibold'
    }"
  >
    <p class="text-white/60 text-sm mb-4">Update your information.</p>
    <div class="flex flex-col gap-1.5 mb-3 text-sm">
      <label for="username" class="font-semibold block w-6rem">Username</label>
      <input
        id="username"
        class="flex-auto bg-transparent ring-white/60 ring-2 rounded-md p-2"
        autocomplete="off"
      />
    </div>
    <div class="flex flex-col align-items-center gap-1.5 mb-5">
      <label for="email" class="font-semibold w-6rem">Email</label>
      <input
        id="email"
        class="flex-auto bg-transparent ring-white/60 ring-2 rounded-md p-2"
        autocomplete="off"
      />
    </div>
    <div class="flex justify-end gap-2">
      <PrimeButton
        type="button"
        label="Save"
        @click="visible = false"
        class="px-6 py-3 rounded-full bg-sky-600"
      ></PrimeButton>
      <PrimeButton
        type="button"
        label="Cancel"
        severity="secondary"
        @click="visible = false"
        class="px-6 py-3 rounded-full bg-zinc-600"
      ></PrimeButton>
    </div>
  </PrimeDialog>
</template>
