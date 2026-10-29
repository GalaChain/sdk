// The mocked chaincode stub reports this channel and chaincode.
export function mockedOperation(method: string): string {
  return `asset-channel_basic-asset_${method}`;
}
