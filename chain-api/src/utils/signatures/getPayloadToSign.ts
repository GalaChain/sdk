import { instanceToPlain } from "class-transformer";
import serialize from "../serialize";

export function getPayloadToSign(obj: object): string {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {signature, trace, ...plain} = instanceToPlain(obj);
  return serialize(plain);
}