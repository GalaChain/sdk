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

export interface GetChaincodeDeploymentDto {
  operationId: string;
  chaincode: string;
}

export interface PostChaincodeDto {
  org: string;
  channel: string;
  chaincode: string;
  operationId: string;
}

export interface DeployChaincodeDto {
  operationId: string;
  imageTag: string;
  chaincode: string;
  contracts: { contractName: string }[];
}

export interface RegisterChaincodeDto {
  operationId: string;
  channelAdminPublicKey: string;
  publicKeys: string[];
}

export interface ChaincodeInfoDto {
  network: string;
  channel: string;
  chaincode: string;
  imageName: string;
  sequence: number;
  status: string;
  adminPublicKey: string;
  lastUpdated: string;
  developersPublicKeys: string[];
}
