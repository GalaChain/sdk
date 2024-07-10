<script lang="ts">
import MintToken from '@/components/MintToken.vue'
import { h } from 'vue'
import { defineComponent } from 'vue'

// Figure out a way to extend component and add styles, this almost works but props aren't reacting
export default defineComponent({
  extends: MintToken,
  render: () => h(MintToken)
})
</script>

<style lang="css">
@tailwind base;
@tailwind components;
@tailwind utilities;
</style>
