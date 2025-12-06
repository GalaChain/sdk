/*
 * Copyright (c) Gala Games Inc. All rights reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 */
import fs from "fs";
import path from "path";

/**
 * This function might be potentially expensive to run, so it should include
 * only critical checks.
 */
export function verifyPackageConsistency() {
  console.log("Verifying package consistency...");
  checkGrpcVersionConflicts();
}

function checkGrpcVersionConflicts() {
  const packageLockPath = path.resolve(process.cwd(), "package-lock.json");

  if (!fs.existsSync(packageLockPath)) {
    console.warn("No package-lock.json found. Skipping gRPC version check.");
    return;
  }

  const packageLock = JSON.parse(fs.readFileSync(packageLockPath, "utf8"));
  const dependencies = packageLock.dependencies ?? {};

  const grpcVersions = Object.keys(dependencies)
    .filter((dep) => dep === "@grpc/grpc-js")
    .map((dep) => dependencies[dep].version);

  const uniqueVersions = [...new Set(grpcVersions)].sort();

  if (uniqueVersions.length > 1) {
    console.warn(
      `Warning: Conflicting versions of @grpc/grpc-js detected: ${uniqueVersions.join(", ")}.\n` +
        "This may cause issues when starting the chaincode.\n" +
        "Please ensure that all dependencies are using the same version of @grpc/grpc-js.\n" +
        "You can try running `npm dedupe` to resolve the issue or manually update the version in your package.json.\n"
    );
  } else {
    console.log("No conflicting versions of @grpc/grpc-js detected.");
  }
}
