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
import tracer from "dd-trace";

import { Context } from "fabric-contract-api";

import { GalaChainContext } from "../types";

type TraceType = "before" | "around" | "after";

function traceName(ctx: Context, type: TraceType): string {
  const method = ctx.stub.getFunctionAndParameters().fcn;
  return `${method}:${type}`;
}

export function trace<R>(type: TraceType, ctx: GalaChainContext, fn: () => R) {
  return tracer.trace(traceName(ctx, type), { childOf: ctx.span }, fn);
}
