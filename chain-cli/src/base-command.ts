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
import { Command, Flags, Interfaces } from "@oclif/core";

enum LogLevel {
  debug = "debug",
  info = "info",
  warn = "warn",
  error = "error"
}

export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  (typeof BaseCommand)["baseFlags"] & T["flags"]
>;
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T["args"]>;

export default abstract class BaseCommand<T extends typeof Command> extends Command {
  // add the --json flag
  static override enableJsonFlag = true;

  // define flags that can be inherited by any command that extends BaseCommand
  static override baseFlags = {
    "log-level": Flags.custom<LogLevel>({
      summary: "Specify level for logging.",
      options: Object.values(LogLevel),
      helpGroup: "GLOBAL"
    })()
  };

  protected flags!: Flags<T>;
  protected args!: Args<T>;

  public override async init(): Promise<void> {
    await super.init();
    const { args, flags } = await this.parse({
      flags: this.ctor.flags,
      baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
      args: this.ctor.args,
      strict: this.ctor.strict
    });
    this.flags = flags as Flags<T>;
    this.args = args as Args<T>;
  }

  protected override async catch(err: Error & { exitCode?: number }): Promise<void> {
    // add any custom logic to handle errors from the command
    // or simply return the parent class error handling
    return super.catch(err);
  }

  protected override async finally(_: Error | undefined): Promise<void> {
    // called after run and catch regardless of whether or no the command errored
    return super.finally(_);
  }
}
