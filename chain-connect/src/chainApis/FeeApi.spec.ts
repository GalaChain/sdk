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
import { FeeApi } from "./FeeApi";

describe("FeeApi", () => {
  // Verify SetFeeProperties uses correct method name and signing
  it("SetFeeProperties should submit with correct method and sign flag", async () => {
    const mockSubmit = jest.fn().mockResolvedValue({ Status: 1, Data: {} });
    const mockConnection = { submit: mockSubmit } as any;

    const feeApi = new FeeApi("https://example.com", mockConnection);

    const dto = {} as any;
    await feeApi.SetFeeProperties(dto);

    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "FetchFeeProperties",
        sign: true
      })
    );
  });
});
