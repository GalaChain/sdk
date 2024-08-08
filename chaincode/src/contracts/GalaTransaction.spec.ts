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
import { ChainCallDTO, UserProfile, UserRole } from "@gala-chain/api";
import { ChainUser } from "@gala-chain/client";
import {
  fixture,
  transactionErrorKey,
  transactionErrorMessageContains,
  transactionSuccess
} from "@gala-chain/test";

import { GalaChainContext } from "../types";
import { GalaContract } from "./GalaContract";
import { EVALUATE, GalaTransaction, GalaTransactionType, SUBMIT } from "./GalaTransaction";

describe("authorization", () => {
  type TestParams = [
    "Evaluate" | "Submit",
    string[] | "no org constraint",
    string[] | "no roles constraint",
    "no sig verif"?
  ];

  const defaultCaId = "client|ca-user";
  const defaultMsp = "TestOrg";

  const registeredUser = {
    alias: "client|auth-test-user",
    roles: [UserRole.EVALUATE, UserRole.SUBMIT, "CUSTOM_ROLE"]
  };

  it("should allow public access to evaluate method", async () => {
    // When
    const f = authFixture(["Evaluate", "no org constraint", "no roles constraint", "no sig verif"]);

    // Then
    expect(await f.signedCall()).toEqual(transactionSuccess(registeredUser));
    expect(await f.unsignedCall()).toEqual(
      transactionSuccess({ alias: defaultCaId, roles: [UserRole.EVALUATE] })
    );
  });

  it("should not allow to define public access to submit method", async () => {
    // When
    const f = () => authFixture(["Submit", "no org constraint", "no roles constraint", "no sig verif"]);

    // Then
    expect(f).toThrow("SUBMIT transaction must have either verifySignature or allowedOrgs defined");
  });

  it("should authorize by organization for evaluate method", async () => {
    // When
    const f1 = authFixture(["Evaluate", [defaultMsp], "no roles constraint", "no sig verif"]);
    const f2 = authFixture(["Evaluate", ["AnotherOrg"], "no roles constraint", "no sig verif"]);
    const f3 = authFixture(["Evaluate", [defaultMsp], "no roles constraint"]);
    const f4 = authFixture(["Evaluate", ["AnotherOrg"], "no roles constraint"]);

    // Then
    expect(await f1.signedCall()).toEqual(transactionSuccess(registeredUser));
    expect(await f1.unsignedCall()).toEqual(
      transactionSuccess({ alias: defaultCaId, roles: [UserRole.EVALUATE] })
    );

    expect(await f2.signedCall()).toEqual(transactionErrorKey("ORGANIZATION_NOT_ALLOWED"));
    expect(await f2.unsignedCall()).toEqual(transactionErrorKey("ORGANIZATION_NOT_ALLOWED"));

    expect(await f3.signedCall()).toEqual(transactionSuccess(registeredUser));
    expect(await f3.unsignedCall()).toEqual(transactionErrorKey("MISSING_SIGNATURE"));

    expect(await f4.signedCall()).toEqual(transactionErrorKey("ORGANIZATION_NOT_ALLOWED"));
    expect(await f4.unsignedCall()).toEqual(transactionErrorKey("MISSING_SIGNATURE"));
  });

  it("should authorize by organization for submit method", async () => {
    // When
    const f1 = authFixture(["Submit", [defaultMsp], "no roles constraint", "no sig verif"]);
    const f2 = authFixture(["Submit", ["AnotherOrg"], "no roles constraint", "no sig verif"]);
    const f3 = authFixture(["Submit", [defaultMsp], "no roles constraint"]);
    const f4 = authFixture(["Submit", ["AnotherOrg"], "no roles constraint"]);

    // Then
    expect(await f1.signedCall()).toEqual(transactionSuccess(registeredUser));
    const f1UnsignedCallResponse = await f1.unsignedCall();
    expect(f1UnsignedCallResponse).toEqual(transactionErrorKey("MISSING_ROLE"));
    expect(f1UnsignedCallResponse).toEqual(
      transactionErrorMessageContains(
        // EVALUATE is default role for anonymous user (no signature)
        "User client|ca-user does not have one of required roles: SUBMIT (has: EVALUATE)"
      )
    );

    expect(await f2.signedCall()).toEqual(transactionErrorKey("ORGANIZATION_NOT_ALLOWED"));
    expect(await f2.unsignedCall()).toEqual(transactionErrorKey("ORGANIZATION_NOT_ALLOWED"));

    expect(await f3.signedCall()).toEqual(transactionSuccess(registeredUser));
    expect(await f3.unsignedCall()).toEqual(transactionErrorKey("MISSING_SIGNATURE"));

    expect(await f4.signedCall()).toEqual(transactionErrorKey("ORGANIZATION_NOT_ALLOWED"));
    expect(await f4.unsignedCall()).toEqual(transactionErrorKey("MISSING_SIGNATURE"));
  });

  it("should authorize by roles for evaluate method", async () => {
    // When
    const f1 = authFixture(["Evaluate", "no org constraint", [UserRole.EVALUATE], "no sig verif"]);
    const f2 = authFixture(["Evaluate", "no org constraint", ["CUSTOM_ROLE"], "no sig verif"]);
    const f3 = authFixture(["Evaluate", "no org constraint", ["ANOTHER_ROLE"], "no sig verif"]);
    const f4 = authFixture(["Evaluate", "no org constraint", [UserRole.EVALUATE]]);
    const f5 = authFixture(["Evaluate", "no org constraint", ["CUSTOM_ROLE"]]);
    const f6 = authFixture(["Evaluate", "no org constraint", ["ANOTHER_ROLE"]]);

    // Then
    expect(await f1.signedCall()).toEqual(transactionSuccess(registeredUser));
    expect(await f1.unsignedCall()).toEqual(
      // EVALUATE is default role for anonymous user (no signature)
      transactionSuccess({ alias: defaultCaId, roles: [UserRole.EVALUATE] })
    );

    expect(await f2.signedCall()).toEqual(transactionSuccess(registeredUser));
    expect(await f2.unsignedCall()).toEqual(transactionErrorKey("MISSING_ROLE")); // only EVALUATE role is present

    expect(await f3.signedCall()).toEqual(transactionErrorKey("MISSING_ROLE"));
    expect(await f3.unsignedCall()).toEqual(transactionErrorKey("MISSING_ROLE"));

    expect(await f4.signedCall()).toEqual(transactionSuccess(registeredUser));
    expect(await f4.unsignedCall()).toEqual(transactionErrorKey("MISSING_SIGNATURE"));

    expect(await f5.signedCall()).toEqual(transactionSuccess(registeredUser));
    expect(await f5.unsignedCall()).toEqual(transactionErrorKey("MISSING_SIGNATURE"));

    expect(await f6.signedCall()).toEqual(transactionErrorKey("MISSING_ROLE"));
    expect(await f6.unsignedCall()).toEqual(transactionErrorKey("MISSING_SIGNATURE"));
  });

  it("should authorize by roles for submit method", async () => {
    // When
    const f1 = authFixture(["Submit", "no org constraint", [UserRole.EVALUATE]]);
    const f2 = authFixture(["Submit", "no org constraint", ["CUSTOM_ROLE"]]);
    const f3 = authFixture(["Submit", "no org constraint", ["ANOTHER_ROLE"]]);
    // note: SUBMIT transaction must have either verifySignature or allowedOrgs defined

    // Then
    expect(await f1.signedCall()).toEqual(transactionSuccess(registeredUser));
    expect(await f1.unsignedCall()).toEqual(transactionErrorKey("MISSING_SIGNATURE"));

    expect(await f2.signedCall()).toEqual(transactionSuccess(registeredUser));
    expect(await f2.unsignedCall()).toEqual(transactionErrorKey("MISSING_SIGNATURE"));

    expect(await f3.signedCall()).toEqual(transactionErrorKey("MISSING_ROLE"));
    expect(await f3.unsignedCall()).toEqual(transactionErrorKey("MISSING_SIGNATURE"));
  });

  it("should not allow to define both allowed orgs and roles", async () => {
    // When
    const f1 = () => authFixture(["Evaluate", [defaultMsp], [UserRole.EVALUATE], "no sig verif"]);
    const f2 = () => authFixture(["Submit", [defaultMsp], [UserRole.EVALUATE], "no sig verif"]);
    const f3 = () => authFixture(["Evaluate", [defaultMsp], [UserRole.EVALUATE]]);
    const f4 = () => authFixture(["Submit", [defaultMsp], [UserRole.EVALUATE]]);

    // Then
    expect(f1).toThrow("allowedRoles and allowedOrgs cannot be defined at the same time");
    expect(f2).toThrow("allowedRoles and allowedOrgs cannot be defined at the same time");
    expect(f3).toThrow("allowedRoles and allowedOrgs cannot be defined at the same time");
    expect(f4).toThrow("allowedRoles and allowedOrgs cannot be defined at the same time");
  });

  it("should assume default roles when user roles are undefined", async () => {
    // Given
    const customUser = {
      alias: "client|undef-roles-user",
      roles: undefined
    };

    const expectedUser = {
      alias: customUser.alias,
      roles: UserProfile.DEFAULT_ROLES
    };

    // When
    const f1 = authFixture(["Evaluate", "no org constraint", "no roles constraint"], customUser);
    const f2 = authFixture(["Submit", "no org constraint", "no roles constraint"], customUser);

    // Then
    expect(await f1.signedCall()).toEqual(transactionSuccess(expectedUser));
    expect(await f2.signedCall()).toEqual(transactionSuccess(expectedUser));
  });

  it("should assume no roles when user roles are empty", async () => {
    // Given
    const customUser = {
      alias: "client|empty-roles-user",
      roles: []
    };

    // const expectedUser = {
    //   alias: customUser.alias,
    //   roles: []
    // };

    // When
    const f1 = authFixture(["Evaluate", "no org constraint", "no roles constraint"], customUser);
    const f2 = authFixture(["Submit", "no org constraint", "no roles constraint"], customUser);

    // Then
    expect(await f1.signedCall()).toEqual(
      transactionErrorMessageContains("does not have one of required roles: EVALUATE (has: no roles)")
    );
    expect(await f2.signedCall()).toEqual(
      transactionErrorMessageContains("does not have one of required roles: SUBMIT (has: no roles)")
    );
  });

  function authFixture(
    [typeParam, orgsParam, rolesParam, sigParam]: TestParams,
    customUser: { alias: string; roles: string[] | undefined } = registeredUser
  ) {
    const type = typeParam === "Evaluate" ? EVALUATE : SUBMIT;
    const verifySignature = sigParam !== "no sig verif";
    const allowedOrgs = orgsParam === "no org constraint" ? undefined : orgsParam;
    const allowedRoles = rolesParam === "no roles constraint" ? undefined : rolesParam;

    const user = {
      ...ChainUser.withRandomKeys(customUser.alias),
      roles: customUser.roles
    };

    const ContractClass = TestContractClass(type, verifySignature, allowedOrgs, allowedRoles);

    const f = fixture(ContractClass).caClientIdentity(defaultCaId, defaultMsp).registeredUsers(user);

    const unsignedDto = new ChainCallDTO();
    unsignedDto.uniqueKey = "uniqueKey-123";

    const signedDto = new ChainCallDTO();
    signedDto.uniqueKey = "uniqueKey-456";
    signedDto.sign(user.privateKey);

    return {
      user,
      signedCall: () => f.contract.GetCallingUser(f.ctx, signedDto),
      unsignedCall: () => f.contract.GetCallingUser(f.ctx, unsignedDto)
    };
  }

  function TestContractClass(
    type: GalaTransactionType,
    verifySignature: boolean,
    allowedOrgs: string[] | undefined,
    allowedRoles: string[] | undefined
  ) {
    const ContractClass = class extends GalaContract {
      constructor() {
        super("TestContract", "1.0.0");
      }

      public async GetCallingUser(ctx: GalaChainContext, dto: ChainCallDTO): Promise<unknown> {
        try {
          return {
            alias: ctx.callingUser,
            roles: ctx.callingUserRoles
          };
        } catch (e) {
          return undefined;
        }
      }
    };

    // we need to manually call decorator, since decorators are not available for anonymous classes

    const target = ContractClass.prototype;
    const propertyKey = "GetCallingUser";
    const descriptor = Object.getOwnPropertyDescriptor(target, propertyKey) as PropertyDescriptor;

    GalaTransaction({
      type,
      in: ChainCallDTO,
      out: "object",
      allowedOrgs,
      allowedRoles,
      ...(verifySignature ? { verifySignature: true } : {})
    })(target, propertyKey, descriptor);

    // descriptor is changed but not applied to the class, so we need to set it back
    Object.defineProperty(target, propertyKey, descriptor);

    return ContractClass;
  }
});
