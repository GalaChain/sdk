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
import { createRequire } from "module";

import type { CAClient as CAClientType } from "./hf/CAClient";
import type { HFClient as HFClientType } from "./hf/HFClient";
import type { HFClientBuilder as HFClientBuilderType } from "./hf/HFClientBuilder";

export * from "./gcclient";
export * from "./rest-api";
export * from "./generic";
export * from "./api";
export * from "./wire";
export * from "./test";

export declare const HFClient: typeof HFClientType;
export declare const HFClientBuilder: typeof HFClientBuilderType;
export declare const CAClient: typeof CAClientType;

declare const exports: Record<string, unknown>;

const nodeRequire = createRequire(__filename);
const fabricExportNames = ["HFClient", "HFClientBuilder", "CAClient"] as const;

function loadFabricClient(): typeof import("./hf") {
  return nodeRequire("./hf");
}

for (const name of fabricExportNames) {
  Object.defineProperty(exports, name, {
    enumerable: true,
    configurable: true,
    get: () => loadFabricClient()[name]
  });
}
