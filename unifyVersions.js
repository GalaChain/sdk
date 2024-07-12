#!/usr/bin/env node

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

/*
 * This script is used to enforce the same version of a dependency in all packages.
 *
 * First, it checks if the version of the dependency in the root package.json is
 * the same as version in child package.json files. If the version is different,
 * it ends with an error.
 *
 * Then, it updates all versions of the dependencies in all package.json files,
 * and chaincode template package lock file.
 */

const fs = require("fs");
const childProcess = require("child_process");

const packages = [
  ".",
  "./chain-api",
  "./chain-cli",
  "./chain-cli/chaincode-template",
  "./chain-client",
  "./chain-connect",
  "./chain-test",
  "./chain-ui/packages/galachain-ui",
  "./chain-ui/packages/galachain-ui-vue",
  "./chaincode"
].map((p) => {
  const packageJsonPath = require.resolve(`${p}/package.json`);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const packageJson = require(packageJsonPath);
  return { packageJsonPath, packageJson };
});

const optionalVersion = process.argv[2];
if (optionalVersion) {
  console.log("Applying version from command line:", optionalVersion);

  // just a sanity check
  if (!optionalVersion.startsWith("1.2.")) {
    console.error("Version must start with '1.2.'");
    process.exit(1);
  }
  packages.forEach(({ packageJson, packageJsonPath }) => {
    console.log(`Updating '${packageJson.name}' to version '${optionalVersion}'...`);
    packageJson.version = optionalVersion;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, undefined, 2) + "\n");
  });
}

const versions = new Set(packages.map((p) => p.packageJson.version));

if (versions.size !== 1) {
  console.error("Versions are not the same for all packages!");
  packages.forEach((p) =>
    console.error(` - ${p.packageJson.version} of ${p.packageJson.name} in ${p.packageJsonPath}`)
  );
  process.exit(1);
}

const versionToApply = versions.values().next().value;
const depsToUpdate = packages.map((p) => p.packageJson.name);

packages.forEach(({ packageJson, packageJsonPath }) => {
  console.log(`Unifying dependencies of '${packageJson.name}'...`);

  const updated = [];

  depsToUpdate.forEach((dep) => {
    ["dependencies", "devDependencies", "peerDependencies"].forEach((groupKey) => {
      const current = packageJson[groupKey]?.[dep];
      if (!!current && current !== versionToApply) {
        console.log(` - updating '${dep}' from '${current}' to '${versionToApply}' in '${groupKey}'`);
        packageJson[groupKey][dep] = versionToApply;
        updated.push(groupKey);
      }
    });
  });

  if (updated.length === 0) {
    console.log(` - everything is up to date`);
  } else {
    console.log(` - saving changes in '${packageJsonPath}'`);
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, undefined, 2) + "\n");
  }
});

// manually apply changes to chaincode-template package-lock.json
console.log("Updating package-lock.json in 'chain-cli/chaincode-template'...");
const chaincodeTemplatePackageLockPath = require.resolve("./chain-cli/chaincode-template/package-lock.json");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chaincodeTemplatePackageLock = require(chaincodeTemplatePackageLockPath);
chaincodeTemplatePackageLock.version = versionToApply;
chaincodeTemplatePackageLock.packages[""].version = versionToApply;

// we don't want to keep versions of SDK modules in the lock file
Object.keys(chaincodeTemplatePackageLock.packages)
  .filter((key) => key.startsWith("node_modules/@gala-chain"))
  .forEach((key) => {
    delete chaincodeTemplatePackageLock.packages[key];
  });

console.log(` - saving changes in '${chaincodeTemplatePackageLockPath}'`);
fs.writeFileSync(
  chaincodeTemplatePackageLockPath,
  JSON.stringify(chaincodeTemplatePackageLock, undefined, 2) + "\n"
);

// execute `npm install` in the root directory to update the lock file and licenses
childProcess.execSync("npm install");

// execute `npm run build` in chain-cli to update the new version in README.md and oclif.manifest.json
childProcess.execSync("npm run build", { cwd: "chain-cli" });
