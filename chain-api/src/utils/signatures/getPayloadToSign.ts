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

import serialize from "../serialize";

export function getPayloadToSign(obj: object): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { signature, trace, ...plain } = instanceToPlain(obj);
  return serialize(plain);
}
