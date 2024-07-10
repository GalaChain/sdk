<script lang="ts">
import MintTokenWithAllowance from '@/components/MintTokenWithAllowance.vue'
import { h } from 'vue'
import { defineComponent } from 'vue'

export default defineComponent({
  extends: MintTokenWithAllowance,
  render: () => h(MintTokenWithAllowance)
})
</script>

<style lang="css">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
