import * as secp from "@noble/secp256k1";
import fs from "fs";
import { writeFile } from "node:fs/promises";
import path from "path";
import { execSync } from "./exec-sync";
import * as process from "process";

export const DEFAULT_PRIVATE_KEYS_DIR = "keys";
export const DEFAULT_DEV_PRIVATE_KEY_NAME = "gc-dev-key";

export async function generateKeys(keysPath: string): Promise<void> {
  const adminPrivateKey = secp.utils.bytesToHex(secp.utils.randomPrivateKey());
  const adminPublicKey = secp.utils.bytesToHex(secp.getPublicKey(adminPrivateKey));

  const devPrivateKey = secp.utils.bytesToHex(secp.utils.randomPrivateKey());
  const devPublicKey = secp.utils.bytesToHex(secp.getPublicKey(adminPrivateKey));

  execSync(`mkdir -p ${keysPath}`);

  await writeFile(`${keysPath}/gc-admin-key.pub`, adminPublicKey);
  await writeFile(`${keysPath}/gc-admin-key`, adminPrivateKey.toString());
  await writeFile(`${keysPath}/gc-dev-key.pub`, devPublicKey);
  await writeFile(`${keysPath}/gc-dev-key`, devPrivateKey.toString());
}

export async function gitignoreKeys(projectPath: string): Promise<void> {
  const gitignorePath = path.resolve(projectPath, ".gitignore");
  const keyEntries = [
    "gc-admin-key",
    `${DEFAULT_DEV_PRIVATE_KEY_NAME}`,
    `${DEFAULT_DEV_PRIVATE_KEY_NAME}.pub`
  ];

  keyEntries.forEach((entry) => fs.appendFileSync(gitignorePath, `${entry}\n`));
}

export function getPrivateKeyFromFile() {
  return fs.readFileSync(
    `${process.cwd()}/${DEFAULT_PRIVATE_KEYS_DIR}/${DEFAULT_DEV_PRIVATE_KEY_NAME}`,
    "utf8"
  );
}
