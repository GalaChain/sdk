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
import * as process from "process";

import { execSync } from "./exec-sync";

export class Shell {
  private win32ShellPattern = /[^/]+/g;

  mkdir(targetPath: string): Shell {
    if (process.platform === "win32") {
      execSync(`mkdir "${targetPath.match(this.win32ShellPattern)}"`);
    } else {
      execSync(`mkdir -p "${targetPath}"`);
    }
    return this;
  }

  cd(targetPath: string): Shell {
    if (process.platform === "win32") {
      execSync(`cd "${targetPath.match(this.win32ShellPattern)}"`);
      return this;
    } else {
      execSync(`cd "${targetPath}"`);
      return this;
    }
  }

  cp(fileToCopy: string, destinationPath: string): Shell {
    execSync(`cp "${fileToCopy}" "${destinationPath}/"`);
    return this;
  }

  cpR(sourceDirectory: string, destinationDirectory: string): Shell {
    if (process.platform === "win32") {
      execSync(
        `xcopy ${sourceDirectory.match(this.win32ShellPattern)} ${destinationDirectory.match(
          this.win32ShellPattern
        )} /E /I`
      );
      return this;
    } else {
      execSync(`cp -R ${sourceDirectory} ${destinationDirectory}`);
      return this;
    }
  }

  ls(): Shell {
    if (process.platform === "win32") {
      execSync("dir");
    } else {
      execSync("ls -lh");
    }
    return this;
  }
}
