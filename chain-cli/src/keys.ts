import * as secp from "@noble/secp256k1";
import { execSync } from "./exec-sync";
import { writeFile } from "node:fs/promises";
import path from "path";
import fs from "fs";

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
  const keyEntries = ["gc-admin-key", "gc-dev-key", "gc-dev-key.pub"];

  keyEntries.forEach((entry) => fs.appendFileSync(gitignorePath, `${entry}\n`));
}
