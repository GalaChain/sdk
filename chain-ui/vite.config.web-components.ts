/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
    outDir: 'packages/galachain-ui/lib',
    lib: {
      entry: path.resolve(__dirname, 'src/web-components-package.ts'),
      formats: ['es', 'umd', 'cjs'],
      name: '@gala-chain/ui',
      fileName: (format) => `gala-chain-ui.${format}.js`
    },
    rollupOptions: {
      // external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})
