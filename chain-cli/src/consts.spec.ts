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
import { ServicePortal, joinServiceUrl } from "./consts";

describe("joinServiceUrl", () => {
  it("joins a base that already ends with a slash using one slash", () => {
    expect(joinServiceUrl("https://gateway-testnet.galachain.com/cli/", "api/deploy")).toEqual(
      "https://gateway-testnet.galachain.com/cli/api/deploy"
    );
  });

  it("joins a base that does not end with a slash using one slash", () => {
    expect(joinServiceUrl("https://gateway-testnet.galachain.com/cli", "api/deploy")).toEqual(
      "https://gateway-testnet.galachain.com/cli/api/deploy"
    );
  });

  it("collapses extra slashes at the join", () => {
    expect(joinServiceUrl("https://example.com/cli///", "/api/register")).toEqual(
      "https://example.com/cli/api/register"
    );
  });
});

describe("ServicePortal", () => {
  it("builds each service path with a single slash after the base", () => {
    const urls = [
      ServicePortal.GET_DEPLOYMENT_URL,
      ServicePortal.DEPLOY_URL,
      ServicePortal.GET_LOGS_URL,
      ServicePortal.STREAM_LOGS_URL,
      ServicePortal.REGISTER_URL
    ];

    for (const url of urls) {
      expect(url).not.toMatch(/([^:]\/)\/+/);
      expect(url).toMatch(/\/api\//);
    }
  });
});
