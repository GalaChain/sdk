import { ChainCallDTO, createValidDTO } from "../types";
import { IsUserRef } from "./IsUserRef";

class TestClass extends ChainCallDTO {
  @IsUserRef()
  user: string;
}

const checksumedEthAddress = "0abB6F637a51eb26665e0DeBc5CE8A84e1fa8AC3";
const lowerCaseEthAddress = checksumedEthAddress.toLowerCase();
const ethWithInvalidChecksum = checksumedEthAddress.replace("a", "A");

test.each<[string, string, string]>([
  ["valid legacy alias", "client|123", "client|123"],
  ["valid eth alias", `eth|${checksumedEthAddress}`, `eth|${checksumedEthAddress}`],
  ["valid checksumed address", checksumedEthAddress, `eth|${checksumedEthAddress}`],
  ["valid lowercased address (1)", lowerCaseEthAddress, `eth|${checksumedEthAddress}`],
  ["valid lowercased address (2)", ethWithInvalidChecksum.toLowerCase(), `eth|${checksumedEthAddress}`]
])("%s", async (label, input, expected) => {
  // Given
  const plain = { user: input };

  // When
  const validated = await createValidDTO(TestClass, plain);

  // Then
  expect(validated.user).toBe(expected);
});

test.each<[string, string, string]>([
  ["invalid client alias (1)", "client|123|45", "Expected string following the format"],
  ["invalid client alias (2)", "client|", "Expected string following the format"],
  ["invalid eth alias (1)", `eth|${lowerCaseEthAddress}`, "'eth|' must end with valid checksumed"],
  ["invalid eth alias (2)", "eth|123", "'eth|' must end with valid checksumed"],
  ["invalid eth address (1)", ethWithInvalidChecksum, "please make sure it is checksumed properly"],
  ["invalid eth address (2)", "0xabcdefg", "Invalid eth address provided"]
])("%s", async (label, input, expectedError) => {
  // Given
  const plain = { user: input };

  // When
  const failed = createValidDTO(TestClass, plain);

  // Then
  await expect(failed).rejects.toThrow(expectedError);
});
