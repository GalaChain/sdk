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
import {
  TokenClass,
  TokenInstanceKey,
  TokenInstanceMetadata,
  TokenInstanceMetadataAttribute,
  TokenInstanceMetadataCustomField,
  TokenInstanceMetadataProject,
  createValidChainObject
} from "@gala-chain/api";
import { plainToInstance } from "class-transformer";

import { fetchTokenInstance } from "../token/fetchTokenInstance";
import { GalaChainContext } from "../types";
import { getObjectByKey, objectExists, putChainObject } from "../utils/state";
import { NotProjectMetadataOwnerError, TokenInstanceNotFoundError } from "./TokenInstanceMetadataError";
import {
  buildTokenInstanceMetadataCompositeKey,
  ensureNftInstance,
  fetchTokenInstanceMetadataProject
} from "./tokenInstanceMetadataHelpers";

// class-transformer copies undeclared properties onto the instance, and nothing in the SDK
// strips them -- no whitelist or excludeExtraneousValues is configured -- so anything extra a
// caller sends on an attribute or custom field survives validation. createValidChainObject then
// assigns by reference rather than rebuilding, and it would reach world state unbounded, since
// undeclared fields are subject to none of the MaxLength caps declared on these types.
// Rebuild both from their declared fields only, so nothing else is persisted.
function toStoredAttribute(attribute: TokenInstanceMetadataAttribute): TokenInstanceMetadataAttribute {
  return plainToInstance(TokenInstanceMetadataAttribute, {
    traitType: attribute.traitType,
    value: attribute.value,
    displayType: attribute.displayType
  });
}

function toStoredCustomField(
  customField: TokenInstanceMetadataCustomField
): TokenInstanceMetadataCustomField {
  return plainToInstance(TokenInstanceMetadataCustomField, {
    key: customField.key,
    value: customField.value
  });
}

export interface SetTokenInstanceMetadataParams {
  tokenInstance: TokenInstanceKey;
  project: string;
  name?: string;
  description?: string;
  image?: string;
  externalUrl?: string;
  animationUrl?: string;
  backgroundColor?: string;
  youtubeUrl?: string;
  attributes?: TokenInstanceMetadataAttribute[];
  customFields?: TokenInstanceMetadataCustomField[];
}

export async function setTokenInstanceMetadata(
  ctx: GalaChainContext,
  params: SetTokenInstanceMetadataParams
): Promise<TokenInstanceMetadata> {
  const { tokenInstance, project } = params;

  await ensureNftInstance(ctx, tokenInstance);

  await fetchTokenInstance(ctx, tokenInstance).catch(() => {
    throw new TokenInstanceNotFoundError(tokenInstance.toStringKey());
  });

  // the first user to create metadata for a project on a token class becomes
  // the owner of that project's metadata for the whole class
  const ownership = await fetchTokenInstanceMetadataProject(ctx, tokenInstance, project);

  if (ownership === undefined) {
    const newOwnership = await createValidChainObject(TokenInstanceMetadataProject, {
      collection: tokenInstance.collection,
      category: tokenInstance.category,
      type: tokenInstance.type,
      additionalKey: tokenInstance.additionalKey,
      project,
      owner: ctx.callingUser,
      created: ctx.txUnixTime
    });
    await putChainObject(ctx, newOwnership);
  } else if (ownership.owner !== ctx.callingUser) {
    const classKey = TokenClass.buildTokenClassCompositeKey(tokenInstance);
    throw new NotProjectMetadataOwnerError(ctx.callingUser, project, classKey, ownership.owner);
  }

  const metadataKey = buildTokenInstanceMetadataCompositeKey(tokenInstance, project);

  // deliberately not a .catch() on the read: only a missing document may resolve to undefined,
  // since undefined resets createdBy/created below and would otherwise discard provenance
  const metadataExists = await objectExists(ctx, metadataKey);
  const existing = metadataExists ? await getObjectByKey(ctx, TokenInstanceMetadata, metadataKey) : undefined;

  const metadata = await createValidChainObject(TokenInstanceMetadata, {
    collection: tokenInstance.collection,
    category: tokenInstance.category,
    type: tokenInstance.type,
    additionalKey: tokenInstance.additionalKey,
    instance: tokenInstance.instance,
    project,
    name: params.name,
    description: params.description,
    image: params.image,
    externalUrl: params.externalUrl,
    animationUrl: params.animationUrl,
    backgroundColor: params.backgroundColor,
    youtubeUrl: params.youtubeUrl,
    attributes: params.attributes?.map(toStoredAttribute),
    customFields: params.customFields?.map(toStoredCustomField),
    createdBy: existing?.createdBy ?? ctx.callingUser,
    created: existing?.created ?? ctx.txUnixTime,
    lastModifiedBy: ctx.callingUser,
    lastModified: ctx.txUnixTime
  });

  await putChainObject(ctx, metadata);

  return metadata;
}
