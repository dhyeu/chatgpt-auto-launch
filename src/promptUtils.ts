// src/promptUtils.ts
// This module provides utility functions for building prompts to send to ChatGPT.
// It includes a function to create a prompt based on the action (explain or refactor),
// the selected code, and the document context (file name and workspace).
import * as vscode from 'vscode';

export function buildPrompt(
  action: "explain" | "refactor",
  code: string,
  document: vscode.TextDocument
): string {
  const fileName = document.fileName.split('/').pop() || "this file";
  const workspace = vscode.workspace.name || "this workspace";

  const base = action === "explain"
    ? `Explain the following code from ${fileName} in my ${workspace} workspace:`
    : `Refactor the following code from ${fileName} in my ${workspace} workspace:`;

  return `${base}\n\n${code}`;
}
