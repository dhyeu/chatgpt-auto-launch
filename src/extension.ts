// src/extension.ts
// This file is the entry point for the VS Code extension.
// It registers the ChatGPTSidebarProvider and sets up commands for explaining and refactoring code.
// The extension allows users to interact with ChatGPT directly from the sidebar,
// making it easy to get explanations or refactor code snippets without leaving the editor.
// It also includes utility functions for building prompts based on user actions and selected code.
// The activate function is called when the extension is activated, and it sets up the necessary components
// for the sidebar and commands. The deactivate function can be used to clean up resources if needed.
// Also includes a beautifyCode function that formats code using Prettier based on the language ID.
import * as vscode from 'vscode';
import { ChatGPTSidebarProvider } from './chatgptSidebarProvider';
import { buildPrompt } from './promptUtils';
import { beautifyCode } from './beautifyUtils';

export function activate(context: vscode.ExtensionContext) {
  console.log("✅ ChatGPT Extension activated");

  const provider = new ChatGPTSidebarProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("chatgptSidebar", provider)
  );

  // 🧠 Explain Code Command
  context.subscriptions.push(
    vscode.commands.registerCommand('chatgptAutoLaunch.explainCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.selection;
      const selectedCode = editor.document.getText(selection);
      if (!selectedCode.trim()) {
        vscode.window.showWarningMessage("No code selected.");
        return;
      }

      const prompt = buildPrompt("explain", selectedCode, editor.document);
      context.globalState.update("lastPrompt", prompt);

      const url = `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`;
      vscode.env.openExternal(vscode.Uri.parse(url));
    })
  );

  // 🔧 Refactor Code Command
  context.subscriptions.push(
    vscode.commands.registerCommand('chatgptAutoLaunch.refactorCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.selection;
      const selectedCode = editor.document.getText(selection);
      if (!selectedCode.trim()) {
        vscode.window.showWarningMessage("No code selected.");
        return;
      }

      const prompt = buildPrompt("refactor", selectedCode, editor.document);
      context.globalState.update("lastPrompt", prompt);

      const url = `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`;
      vscode.env.openExternal(vscode.Uri.parse(url));
    })
  );

  // 🧹 Beautify Code Command
  context.subscriptions.push(
    vscode.commands.registerCommand('chatgptAutoLaunch.beautifyCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const selection = editor.selection;
      const code = editor.document.getText(selection);
      if (!code.trim()) {
        vscode.window.showWarningMessage("No code selected.");
        return;
      }

      try {
        const formatted = await beautifyCode(code, editor.document.languageId);
        editor.edit((editBuilder) => {
          editBuilder.replace(selection, formatted);
        });

        vscode.window.showInformationMessage("✅ Code beautified!");
      } catch (err: any) {
        vscode.window.showErrorMessage("⚠️ Could not format code: " + err.message);
      }
    })
  );
}

export function deactivate() {}