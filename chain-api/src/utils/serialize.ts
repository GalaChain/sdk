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
import { instanceToPlain } from "class-transformer";
import stringify from "json-stringify-deterministic";

/**
 * @description
 *
 * Serialze the provided object to a string in a determinsitic fashion.
 * See Hyperledger Fabric's documentation on
 * [JSON Determinism](https://hyperledger-fabric.readthedocs.io/en/release-2.5/chaincode4ade.html#json-determinism)
 * for more details.
 *
 * @param object
 * @returns unknown
 */
export default function serialize(object: unknown) {
  return stringify(instanceToPlain(object));
}
