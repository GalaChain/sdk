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
import { JSONSchema } from "class-validator-jsonschema";
import { ArrayNotEmpty, IsOptional, IsString } from "class-validator";

import { ChainCallDTO } from "./dtos";

@JSONSchema({
  description: "DTO for authorizing users to call BatchSubmit"
})
export class AuthorizeBatchSubmitterDto extends ChainCallDTO {
  @JSONSchema({
    description: "User to authorize for BatchSubmit operations"
  })
  @IsString()
  @ArrayNotEmpty()
  authorizers: string[];
}

@JSONSchema({
  description: "DTO for deauthorizing users from calling BatchSubmit"
})
export class DeauthorizeBatchSubmitterDto extends ChainCallDTO {
  @JSONSchema({
    description: "User to deauthorize from BatchSubmit operations"
  })
  @IsString()
  authorizer: string;
}

@JSONSchema({
  description: "DTO for fetching batch submit authorizations"
})
export class FetchBatchSubmitAuthorizationsDto extends ChainCallDTO {
  // No additional fields needed for fetching all authorizations
}

@JSONSchema({
  description: "Response DTO for batch submit authorizations"
})
export class BatchSubmitAuthorizationsResDto extends ChainCallDTO {
  @JSONSchema({
    description: "List of authorized users for BatchSubmit operations"
  })
  @IsString({ each: true })
  authorities: string[];
} 