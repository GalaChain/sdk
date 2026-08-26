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
import { plainToInstance } from "class-transformer";

import {
  FetchTokenInstanceMetadataWithPaginationDto,
  MAX_METADATA_ATTRIBUTES,
  MAX_METADATA_CUSTOM_FIELDS,
  SetTokenInstanceMetadataDto
} from "./TokenInstanceMetadata";

const tokenInstance = {
  collection: "TestCollection",
  category: "Item",
  type: "Elixir",
  additionalKey: "none",
  instance: "1"
};

async function errorsFor(plain: Record<string, unknown>): Promise<string[]> {
  const dto = plainToInstance(SetTokenInstanceMetadataDto, {
    tokenInstance,
    project: "TestProject",
    ...plain
  });
  const errors = await dto.validate();
  return errors.map((e) => e.property);
}

describe("SetTokenInstanceMetadataDto backgroundColor", () => {
  it.each(["ff0000", "FF0000", "aBcDeF", "000000"])("should accept %s", async (backgroundColor) => {
    // When
    const properties = await errorsFor({ backgroundColor });

    // Then
    expect(properties).not.toContain("backgroundColor");
  });

  // the field is documented as six hex characters without a pre-pended #
  it.each(["#ff0000", "#ff0", "fff", "zzzzzz", "ff00", "ff00000", ""])(
    "should reject %s",
    async (backgroundColor) => {
      // When
      const properties = await errorsFor({ backgroundColor });

      // Then
      expect(properties).toContain("backgroundColor");
    }
  );

  it("should accept an omitted backgroundColor", async () => {
    // When
    const properties = await errorsFor({});

    // Then
    expect(properties).not.toContain("backgroundColor");
  });
});

describe("SetTokenInstanceMetadataDto array caps", () => {
  const attribute = (i: number) => ({ traitType: `trait-${i}`, value: i });
  const customField = (i: number) => ({ key: `key-${i}`, value: `value-${i}` });

  it("should accept attributes at the cap", async () => {
    // Given
    const attributes = Array.from({ length: MAX_METADATA_ATTRIBUTES }, (_, i) => attribute(i));

    // When
    const properties = await errorsFor({ attributes });

    // Then
    expect(properties).not.toContain("attributes");
  });

  it("should reject attributes over the cap", async () => {
    // Given
    const attributes = Array.from({ length: MAX_METADATA_ATTRIBUTES + 1 }, (_, i) => attribute(i));

    // When
    const properties = await errorsFor({ attributes });

    // Then
    expect(properties).toContain("attributes");
  });

  it("should accept customFields at the cap", async () => {
    // Given
    const customFields = Array.from({ length: MAX_METADATA_CUSTOM_FIELDS }, (_, i) => customField(i));

    // When
    const properties = await errorsFor({ customFields });

    // Then
    expect(properties).not.toContain("customFields");
  });

  it("should reject customFields over the cap", async () => {
    // Given
    const customFields = Array.from({ length: MAX_METADATA_CUSTOM_FIELDS + 1 }, (_, i) => customField(i));

    // When
    const properties = await errorsFor({ customFields });

    // Then
    expect(properties).toContain("customFields");
  });

  it("should accept unknown properties on attributes", async () => {
    // Given
    const attributes = [{ traitType: "Potency", value: 9, unknownField: "extra" }];

    // When
    const properties = await errorsFor({ attributes });

    // Then
    expect(properties).not.toContain("attributes");
  });

  it("should accept unknown properties on customFields", async () => {
    // Given
    const customFields = [{ key: "gameId", value: "elixir-001", unknownField: "extra" }];

    // When
    const properties = await errorsFor({ customFields });

    // Then
    expect(properties).not.toContain("customFields");
  });

  it("should still reject invalid declared fields on attributes", async () => {
    // Given
    const attributes = [{ traitType: "", value: 9 }];

    // When
    const properties = await errorsFor({ attributes });

    // Then
    expect(properties).toContain("attributes");
  });
});

describe("FetchTokenInstanceMetadataWithPaginationDto instance", () => {
  async function paginationErrorsFor(instance: string): Promise<string[]> {
    const dto = plainToInstance(FetchTokenInstanceMetadataWithPaginationDto, {
      collection: tokenInstance.collection,
      category: tokenInstance.category,
      type: tokenInstance.type,
      additionalKey: tokenInstance.additionalKey,
      instance
    });
    const errors = await dto.validate();
    return errors.map((e) => e.property);
  }

  it.each(["0", "1", "4705", "12345678901234567890"])("should accept %s", async (instance) => {
    // When
    const properties = await paginationErrorsFor(instance);

    // Then
    expect(properties).not.toContain("instance");
  });

  // these would silently return an empty page, since composite keys are built from
  // BigNumber.toString() and would never match a padded or fractional rendering
  it.each(["01", "1.0", "-1", "1e3", " 1", "abc"])("should reject %s", async (instance) => {
    // When
    const properties = await paginationErrorsFor(instance);

    // Then
    expect(properties).toContain("instance");
  });
});
