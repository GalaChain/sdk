import {
  NonFunctionProperties,
  RegisterEthUserDto,
  RegisterUserDto,
  UpdatePublicKeyDto
} from "@gala-chain/api";

type RegisterUserRequest = NonFunctionProperties<RegisterUserDto>;
type RegisterEthUserRequest = NonFunctionProperties<RegisterEthUserDto>;
type UpdatePublicKeyRequest = NonFunctionProperties<UpdatePublicKeyDto>;

export { RegisterUserRequest, RegisterEthUserRequest, UpdatePublicKeyRequest };
