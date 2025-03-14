
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
import * as fs from "fs";
import * as path from "path";

// Configuration
const sources = ["chain-api", "chain-cli", "chain-client", "chain-connect", "chain-test", "chaincode"];
const sourceDir = path.resolve(__dirname, "../chain-api/src");
const outputDir = path.resolve(__dirname, "../resources");

// Function to get all TypeScript files recursively
function getAllTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllTypeScriptFiles(fullPath));
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

// Function to create file header
function createFileHeader(filePath: string): string {
  const relativePath = path.relative(sourceDir, filePath);
  return `// ================================\n// File: ${relativePath}\n// Description: ${getFileDescription(relativePath)}\n// ================================\n\n`;
}

// Function to generate a basic description based on the file path
function getFileDescription(relativePath: string): string {
  const parts = relativePath.split("/");
  const fileName = parts[parts.length - 1];
  const dirContext = parts.slice(0, -1).join("/");
  
  if (fileName === "index.ts") {
    return `Main exports for ${dirContext || "root"} module`;
  }
  
  const nameWithoutExt = fileName.replace(/\.tsx?$/, "");
  const words = nameWithoutExt
    .split(/[-_]|(?=[A-Z])/)
    .map(word => word.toLowerCase());
  
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return `${words.join(" ")}`;
}

// Main execution
try {
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const sourceDir of sources) {
    const files = getAllTypeScriptFiles(sourceDir);
    let combinedContent = "";
  
    for (const file of files) {
      const header = createFileHeader(file);
      const content = fs.readFileSync(file, "utf8");
      combinedContent += header + content + "\n\n";
    }

    const outputFile = path.join(outputDir, `${sourceDir}.txt`);

    fs.writeFileSync(outputFile, combinedContent);
    console.log(`Successfully combined ${files.length} files into ${outputFile}`);
  }
} catch (error) {
  console.error("Error processing files:", error);
  process.exit(1);
}
