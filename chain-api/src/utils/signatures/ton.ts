// verifies if @ton/ton and @ton/crypto libraries are available
import { NotImplementedError } from "../error";

function isTonSupported() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ton = require("@ton/ton");
  if (!ton) {
    throw new NotImplementedError("TON is not supported. Missing library @ton/ton");
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require("@ton/crypto");
  if (!crypto) {
    throw new NotImplementedError("TON is not supported. Missing library @ton/crypto");
  }
}