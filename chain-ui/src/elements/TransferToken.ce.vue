<script lang="ts">
import TransferToken from '@/components/TransferToken.vue';
import { h } from 'vue';
import { defineComponent } from 'vue';

export default defineComponent({
  extends: TransferToken,
  render: () => h(TransferToken)
})
</script>

<style lang="css">
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>