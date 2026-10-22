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

export function catchAxiosError(e?: AxiosError) {
  const data = e?.response?.data as { error?: { Status?: number } } | undefined;
  // A chain error body is returned so callers can deserialize it as a failed response.
  if (data?.error?.Status === 0) {
    return { data: data.error };
  }

  throw e instanceof Error ? e : new Error("Request failed");
}
