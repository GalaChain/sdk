import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import dts from 'vite-plugin-dts'
import { fileURLToPath } from 'url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // treat all tags with a dash as custom elements
          isCustomElement: (tag) => tag.includes('-')
        }
      }
    }),
    dts()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@gala-chain/connect': fileURLToPath(
        new URL('../chain-connect/src/index.ts', import.meta.url)
      ),
      '@gala-chain/api': fileURLToPath(new URL('../chain-api/src/index.ts', import.meta.url))
    }
  },
  build: {
    outDir: 'packages/galachain-ui-vue/dist',
    minify: true,
    lib: {
      entry: path.resolve(__dirname, 'src/vue-package.ts'),
      formats: ['es', 'umd'],
      name: '@gala-chain/ui',
      fileName: (format) => `gala-chain-ui.${format}.js`
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
