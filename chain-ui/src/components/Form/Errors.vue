<script lang="ts" setup>
import { ExclamationTriangleIcon } from '@heroicons/vue/20/solid'
withDefaults(
  defineProps<{
    errors?: string[]
    limit?: number
    color?: string
  }>(),
  {
    color: 'text-red-500'
  }
)
</script>

<template>
  <div v-if="errors?.length" :class="`errors text-xs flex gap-1 ${color}`">
    <ExclamationTriangleIcon class="w-3 h-3 mt-0.5 shrink-0" />
    <ul>
      <template v-for="(err, i) in errors" :key="i">
        <li v-if="!limit || i < limit">
          {{ err }}
        </li>
      </template>
    </ul>
  </div>
</template>
