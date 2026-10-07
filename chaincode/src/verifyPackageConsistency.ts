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

  let packageLock: unknown;
  try {
    packageLock = JSON.parse(fs.readFileSync(packageLockPath, "utf8"));
  } catch (e) {
    console.warn(`Unable to read package-lock.json. Skipping gRPC version check. ${e}`);
    return;
  }

  if (!isInspectableLockfile(packageLock)) {
    console.warn("Unable to read package-lock.json. Skipping gRPC version check.");
    return;
  }

  const uniqueVersions = installedGrpcVersions(packageLock);

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

export function installedGrpcVersions(packageLock: unknown): string[] {
  const versions = new Set<string>();
  if (!packageLock || typeof packageLock !== "object") {
    return [];
  }

  const lock = packageLock as { dependencies?: unknown; packages?: unknown };
  collectDependencyVersions(lock.dependencies, versions);
  collectPackageVersions(lock.packages, versions);
  return [...versions].sort();
}

function collectDependencyVersions(dependencies: unknown, versions: Set<string>): void {
  if (!dependencies || typeof dependencies !== "object") {
    return;
  }

  for (const [name, value] of Object.entries(dependencies as Record<string, unknown>)) {
    if (!value || typeof value !== "object") {
      continue;
    }
    const dependency = value as { version?: unknown; dependencies?: unknown };
    if (name === "@grpc/grpc-js" && typeof dependency.version === "string") {
      versions.add(dependency.version);
    }
    collectDependencyVersions(dependency.dependencies, versions);
  }
}

function collectPackageVersions(packages: unknown, versions: Set<string>): void {
  if (!packages || typeof packages !== "object") {
    return;
  }

  for (const [name, value] of Object.entries(packages as Record<string, unknown>)) {
    if (!isGrpcPackagePath(name) || !value || typeof value !== "object") {
      continue;
    }
    const version = (value as { version?: unknown }).version;
    if (typeof version === "string") {
      versions.add(version);
    }
  }
}

function isGrpcPackagePath(name: string): boolean {
  return name === "node_modules/@grpc/grpc-js" || name.endsWith("/node_modules/@grpc/grpc-js");
}

function isInspectableLockfile(packageLock: unknown): boolean {
  if (!packageLock || typeof packageLock !== "object" || Array.isArray(packageLock)) {
    return false;
  }
  return "dependencies" in packageLock || "packages" in packageLock;
}
