import os from "os";

import { execSync } from "./exec-sync";

export class Shell {
  mkdir(targetPath: string): Shell {
    const operatingSystem = os.platform();
    if (operatingSystem == "win32") {
      execSync(`mkdir "${targetPath}"`);
    } else {
      execSync(`mkdir -p "${targetPath}"`);
    }
    return this;
  }

  cd(targetPath: string): Shell {
    execSync(`cd "${targetPath}"`);
    return this;
  }

  cp(fileToCopy: string, destinationPath: string): Shell {
    execSync(`cp "${fileToCopy}" "${destinationPath}/"`);
    return this;
  }

  cpR(sourceDirectory: string, destinationDirectory: string): Shell {
    execSync(`cp -R "${sourceDirectory}"/* "${destinationDirectory}"`);
    return this;
  }

  ls(): Shell {
    if (os.platform() === "win32") {
      execSync("dir");
    } else {
      execSync("ls -lh");
    }
    return this;
  }
}
