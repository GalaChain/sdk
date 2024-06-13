<template>
  <div>
    <div class="">
      <PrimeButton
        severity="secondary"
        rounded
        @click="isVisible = true"
        class="px-6 py-3 rounded-full bg-sky-600 text-white mb-2"
        >Hello World</PrimeButton
      >
    </div>
    <p>is modal visible? {{ isVisible }}</p>
    <ActionModal v-model:visible="isVisible" header="Custom title" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import PrimeButton from 'primevue/button'
import ActionModal from './ActionModal.vue'

const isVisible = ref(false)
watch(
  isVisible,
  (current, previous) => {
    console.log(`isVisible: ${current}, was ${previous}`)
  },
  { immediate: true }
)
</script>

<style scoped>
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
