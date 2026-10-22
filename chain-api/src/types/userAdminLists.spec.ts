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
import { instanceToPlain, plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { RegisterUserDto, UpdateUserRolesDto } from "./dtos";

describe("user admin lists", () => {
  it("rejects registration that sets both a public key and signers", async () => {
    const dto = plainToInstance(RegisterUserDto, {
      user: "client|alice",
      publicKey: "public-key",
      signers: ["client|bob"],
      uniqueKey: "register-key"
    });

    const errors = await validate(dto);
    expect(errors.some((error) => JSON.stringify(error.constraints).includes("publicKey and signers"))).toBe(
      true
    );
    expect(instanceToPlain(dto).signers).toEqual(["client|bob"]);
  });

  it("rejects a role update that is not a list of names", async () => {
    const dto = plainToInstance(UpdateUserRolesDto, {
      user: "client|alice",
      roles: "admin",
      uniqueKey: "roles-key"
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "roles")).toBe(true);
  });

  it("accepts a role update that is a list of names", async () => {
    const dto = plainToInstance(UpdateUserRolesDto, {
      user: "client|alice",
      roles: ["admin"],
      uniqueKey: "roles-key"
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "roles")).toBe(false);
  });

  it("accepts a role update that clears every role", async () => {
    const dto = plainToInstance(UpdateUserRolesDto, {
      user: "client|alice",
      roles: [],
      uniqueKey: "roles-key"
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "roles")).toBe(false);
  });

  it("rejects a blank role name", async () => {
    const dto = plainToInstance(UpdateUserRolesDto, {
      user: "client|alice",
      roles: [""],
      uniqueKey: "roles-key"
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === "roles")).toBe(true);
  });
});
