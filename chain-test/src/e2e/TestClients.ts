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
  ChainClient,
  ChainUser,
  ChainUserAPI,
  CommonContractAPI,
  ContractConfig,
  GalaChainResponseType,
  PublicKeyContractAPI,
  RegisterEthUserDto,
  RegisterUserDto,
  commonContractAPI,
  createValidSubmitDTO,
  publicKeyContractAPI
} from "@gala-chain/api";
import * as fs from "fs";
import * as path from "path";

import { networkRoot } from "./ContractTestClient";
import { createChainClient } from "./createChainClient";
import { randomize } from "./tokenOps";

interface ContractAPIConfig<API = object> extends ContractConfig {
  api: (c: ChainClient) => API;
}

interface ChainClientOptions {
  [key: string]: ContractAPIConfig;
}

type TestChainClient = ChainClient & ChainUserAPI;

type ChainClientResult<T extends ChainClientOptions> = {
  [K in keyof T]: T[K] extends ContractAPIConfig<infer API>
    ? TestChainClient & API
    : T[K] extends string
      ? TestChainClient & CommonContractAPI
      : never;
};

export type ChainClients<T extends ChainClientOptions = DefaultChainClientOptions> = ChainClientResult<T> & {
  disconnect: () => Promise<void>;
};

function createChainClientsObj<T extends ChainClientOptions>(user: ChainUser, obj: T): ChainClientResult<T> {
  const result: ChainClientResult<T> = {} as ChainClientResult<T>;

  for (const [key, contract] of Object.entries(obj)) {
    const client = createChainClient(user, contract).extendAPI(contract.api);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    result[key] = client;
  }

  return result;
}

export interface ChainClientOptionsWithPK extends ChainClientOptions {
  pk: ContractAPIConfig<PublicKeyContractAPI>;
}

export interface DefaultChainClientOptions extends ChainClientOptions {
  assets: ContractAPIConfig<CommonContractAPI>;
  pk: ContractAPIConfig<PublicKeyContractAPI>;
}

function defaultChainClientsOptions(): DefaultChainClientOptions {
  return {
    assets: {
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "GalaChainToken",
      api: commonContractAPI
    },
    pk: {
      channel: "product-channel",
      chaincode: "basic-product",
      contract: "PublicKeyContract",
      api: publicKeyContractAPI
    }
  };
}

async function create(
  user?: ChainUser | string | undefined
): Promise<ChainClients<DefaultChainClientOptions>>;

async function create<T extends ChainClientOptions>(
  user?: ChainUser | string | undefined,
  opts?: T
): Promise<ChainClients<T>>;

async function create<T extends ChainClientOptions>(opts: T): Promise<ChainClients<T>>;

async function create<T extends ChainClientOptions>(
  user?: ChainUser | string | undefined | T,
  opts?: T
): Promise<ChainClients<T>> {
  if (user === undefined) {
    return create(randomize("curator-"), opts);
  }

  if (typeof user === "string") {
    return create(ChainUser.withRandomKeys(user), opts);
  }

  if (!isUserConfig(user)) {
    return create(ChainUser.withRandomKeys(), user);
  }

  if (opts === undefined) {
    return create(user, defaultChainClientsOptions() as unknown as T);
  }

  const clients: ChainClientResult<ChainClientOptions> = createChainClientsObj(user, opts);

  const disconnect = async () => {
    await Promise.all(Object.values<ChainClient>(clients).map((c) => c.disconnect()));
  };

  return { ...clients, disconnect } as unknown as ChainClients<T>;
}

export type AdminChainClients<T extends ChainClientOptions = DefaultChainClientOptions> = ChainClients<
  T & ChainClientOptionsWithPK
> & {
  createRegisteredUser(userAlias?: string): Promise<ChainUser>;
};

async function createForAdmin<T extends ChainClientOptions>(opts?: T): Promise<AdminChainClients<T>> {
  if (opts === undefined) {
    return createForAdmin(defaultChainClientsOptions() as unknown as T);
  }

  if (opts.pk === undefined) {
    return createForAdmin({ ...opts, pk: defaultChainClientsOptions().pk });
  }

  const admin = getAdminUser();
  const clients = (await create(admin, opts)) as unknown as ChainClients<T & ChainClientOptionsWithPK>;
  const pk = (clients as ChainClients<ChainClientOptionsWithPK>).pk;

  return {
    ...clients,
    createRegisteredUser: async (userAlias?: string) => createRegisteredUser(pk, userAlias)
  };
}

function isUserConfig(user: ChainUser | unknown): user is ChainUser {
  return (
    typeof user === "object" &&
    !!user &&
    "prefix" in user &&
    "name" in user &&
    "identityKey" in user &&
    "ethAddress" in user &&
    "privateKey" in user &&
    "publicKey" in user
  );
}

function getAdminKeyFromPath(keyPath: string) {
  try {
    return fs.readFileSync(keyPath, "utf-8").toString();
  } catch (e) {
    return undefined;
  }
}

function getAdminUser() {
  const defaultKeyPath = path.resolve(networkRoot(), "dev-admin-key/dev-admin.priv.hex.txt");
  const privateKey = process.env.DEV_ADMIN_PRIVATE_KEY ?? getAdminKeyFromPath(defaultKeyPath);

  if (privateKey === undefined) {
    throw new Error(
      `Admin private key not found in ${defaultKeyPath} or environment variable DEV_ADMIN_PRIVATE_KEY`
    );
  }

  return new ChainUser({ name: "admin", privateKey });
}

async function createRegisteredUser(
  client: TestChainClient & PublicKeyContractAPI,
  userAlias?: string
): Promise<ChainUser> {
  const user = ChainUser.withRandomKeys(userAlias);

  if (userAlias === undefined) {
    const dto = await createValidSubmitDTO(RegisterEthUserDto, { publicKey: user.publicKey });
    const response = await client.RegisterEthUser(dto.signed(client.privateKey));
    if (response.Status !== GalaChainResponseType.Success) {
      throw new Error(`Failed to register eth user: ${response.Message}`);
    }
  } else {
    const dto = await createValidSubmitDTO(RegisterUserDto, {
      user: user.identityKey,
      publicKey: user.publicKey
    });
    const response = await client.RegisterUser(dto.signed(client.privateKey));
    if (response.Status !== GalaChainResponseType.Success) {
      throw new Error(`Failed to register user: ${response.Message}`);
    }
  }

  return user;
}

export const TestClients = {
  create,
  createForAdmin
};
