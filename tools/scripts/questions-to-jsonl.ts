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
import * as fs from "fs/promises";
import * as path from "path";

const sourceDir = path.resolve(__dirname, "..", "..");
const questionsDir = path.resolve(sourceDir, "docs", "questions");
const chatmlDir = path.resolve(__dirname, "..", "training-data", "chatml");

const systemRoleContent =
  "You are a GalaChain SDK expert assistant, helping developers write " +
  "chaincode, use the development environment, and integrate with GalaChain. " +
  "You provide accurate, concise guidance based on the official " +
  " SDK documentation and best practices.";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatEntry {
  messages: Message[];
  format: string;
}

async function parseMarkdownFile(filePath: string): Promise<ChatEntry | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");

    let questionContent = "";
    let answerContent = "";
    let currentSection = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("### Question")) {
        currentSection = "question";
        continue;
      } else if (line.startsWith("### Answer")) {
        currentSection = "answer";
        continue;
      }

      if (currentSection === "question") {
        questionContent += line + "\n";
      } else if (currentSection === "answer") {
        answerContent += line + "\n";
      }
    }

    // Clean up the content
    questionContent = questionContent.trim();
    answerContent = answerContent.trim();

    if (!questionContent || !answerContent) {
      console.warn(`Skipping ${filePath}: Missing question or answer content`);
      return null;
    }

    return {
      messages: [
        {
          role: "system",
          content: systemRoleContent
        },
        {
          role: "user",
          content: questionContent
        },
        {
          role: "assistant",
          content: answerContent
        }
      ],
      format: "chatml"
    };
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error);
    return null;
  }
}

async function processMarkdownToJsonl(outputFilePath: string): Promise<void> {
  try {
    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputFilePath), { recursive: true });

    // Get all markdown files
    const files = await fs.readdir(questionsDir);
    const markdownFiles = files.filter((file) => file.endsWith(".md"));

    // Process each file and collect entries
    const entries: ChatEntry[] = [];
    for (const file of markdownFiles) {
      const filePath = path.join(questionsDir, file);
      const entry = await parseMarkdownFile(filePath);
      if (entry) {
        entries.push(entry);
      }
    }

    // Write entries to JSONL file
    const jsonlContent = entries.map((entry) => JSON.stringify(entry)).join("\n");
    await fs.writeFile(outputFilePath, jsonlContent + "\n", "utf-8");

    console.log(`Successfully processed ${entries.length} files to ${outputFilePath}`);
  } catch (error) {
    console.error("Error processing files:", error);
    throw error;
  }
}

// Execute the script
const outputFilePath = path.join(chatmlDir, "questions.jsonl");
processMarkdownToJsonl(outputFilePath).catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
});
