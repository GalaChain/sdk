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

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

const LICENSE_TEXT = `/*
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

`

const LICENSE_TEXT_VUE = `<!--
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
 -->

`

function checkAndAddLicense(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')

  if (!content.startsWith(LICENSE_TEXT)) {
    console.log(`Adding license to ${filePath}`)
    const updatedContent = LICENSE_TEXT + content
    fs.writeFileSync(filePath, updatedContent, 'utf8')
  }
}

function checkAndAddLicenseVue(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')

  if (!content.startsWith(LICENSE_TEXT_VUE)) {
    console.log(`Adding license to ${filePath}`)
    const updatedContent = LICENSE_TEXT_VUE + content
    fs.writeFileSync(filePath, updatedContent, 'utf8')
  }
}

try {
  const files = await glob('**/*.{js,ts}', { ignore: ['node_modules/**', 'dist/**', 'public/**'] })
  files.forEach((file) => checkAndAddLicense(path.resolve(file)))

  const vueFiles = await glob('src/**/*.vue')
  vueFiles.forEach((file) => checkAndAddLicenseVue(path.resolve(file)))
} catch (err) {
  console.error('Error finding files:', err)
  process.exit(1)
}
