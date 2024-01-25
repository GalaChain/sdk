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
import { AxiosError } from "axios";

export function catchAxiosError(e?: AxiosError<{ error?: { Status?: number } }>) {
  // if data object contains { error: { Status: 0 } }, it means this is GalaChainResponse
  if (e?.response?.data?.error?.Status === 0) {
    return { data: e?.response?.data?.error };
  } else {
    const data = { axiosError: { message: e?.message, data: e?.response?.data } };
    return { data: data };
  }
}
