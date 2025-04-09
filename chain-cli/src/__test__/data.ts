export const consts = {
  developerPrivateKey: "bf2168e0e2238b9d879847987f556a093040a2cab07983a20919ac33103d0d00",
  developerPublicKey:
    "04815c06dda6a0e8e9753a67aa638c2aa02e01f7b1d06b8ae5b7570c49f8d8cb894f6f8fda3beed896d1ea70ab54ad069e19d8fdbf7125f9fc23ee6109e2ac38ec",
  chaincodeAdminPublicKey:
    // https://privatekeys.pw/key/c5fbd161d334ba9bbc199bd9a427f05a46aacfabfbb3bc1bff9d227e418d76d9#public
    "04603a599358eb3b2efcde03debc60a493751c1a4f510df18acf857637e74bdbaf6e123736ff75de66b355b5b8ea0a64e179a4e377d3ed965400eff004fa41a74e",
  chaincodeName: "gc-ce89f06e1801fca0cb1b7d7324f9cc0a7b1681dc",
  imageName: "some/image-name:1d",
  imageSha256: "sha256:a123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  contracts: ["TestContract", "OrangesContract"]
};

export const dockerInspectResponse = [
  {
    Id: consts.imageSha256,
    Os: "linux",
    Architecture: "amd64"
  }
];

export const dockerContractNamesResponse = consts.contracts.map((contractName) => ({ contractName }));

export function execSyncMock(cmd: string) {
  if (cmd.includes("docker inspect")) {
    return JSON.stringify(dockerInspectResponse);
  }

  if (cmd.includes("get-contract-names")) {
    return JSON.stringify(dockerContractNamesResponse);
  }

  throw new Error(`Non-mocked command: ${cmd}`);
}

export const axiosPostResponse = {
  data: {}
};

export const axiosGetResponse = {
  data: {
    network: "TNT",
    chaincode: consts.chaincodeName,
    adminPublicKey: consts.chaincodeAdminPublicKey,
    imageName: consts.imageName,
    sequence: 1,
    status: "CC_TEST_STATUS"
  }
};
