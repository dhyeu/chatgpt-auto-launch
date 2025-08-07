"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
// src/extension.ts
// This file is the entry point for the VS Code extension.
// It registers the ChatGPTSidebarProvider and sets up commands for explaining and refactoring code.
// The extension allows users to interact with ChatGPT directly from the sidebar,
// making it easy to get explanations or refactor code snippets without leaving the editor.
// It also includes utility functions for building prompts based on user actions and selected code.
// The activate function is called when the extension is activated, and it sets up the necessary components
// for the sidebar and commands. The deactivate function can be used to clean up resources if needed.
// Also includes a beautifyCode function that formats code using Prettier based on the language ID.
const vscode = __importStar(require("vscode"));
const chatgptSidebarProvider_1 = require("./chatgptSidebarProvider");
const promptUtils_1 = require("./promptUtils");
const beautifyUtils_1 = require("./beautifyUtils");
function activate(context) {
    console.log("✅ ChatGPT Extension activated");
    const provider = new chatgptSidebarProvider_1.ChatGPTSidebarProvider(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider("chatgpt-sidebar-view", provider));
    // 🧠 Explain Code Command
    context.subscriptions.push(vscode.commands.registerCommand('chatgptAutoLaunch.explainCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const selection = editor.selection;
        const selectedCode = editor.document.getText(selection);
        if (!selectedCode.trim()) {
            vscode.window.showWarningMessage("No code selected.");
            return;
        }
        const prompt = (0, promptUtils_1.buildPrompt)("explain", selectedCode, editor.document);
        context.globalState.update("lastPrompt", prompt);
        const url = `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`;
        vscode.env.openExternal(vscode.Uri.parse(url));
    }));
    // 🔧 Refactor Code Command
    context.subscriptions.push(vscode.commands.registerCommand('chatgptAutoLaunch.refactorCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const selection = editor.selection;
        const selectedCode = editor.document.getText(selection);
        if (!selectedCode.trim()) {
            vscode.window.showWarningMessage("No code selected.");
            return;
        }
        const prompt = (0, promptUtils_1.buildPrompt)("refactor", selectedCode, editor.document);
        context.globalState.update("lastPrompt", prompt);
        const url = `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`;
        vscode.env.openExternal(vscode.Uri.parse(url));
    }));
    // 🧹 Beautify Code Command
    context.subscriptions.push(vscode.commands.registerCommand('chatgptAutoLaunch.beautifyCode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const selection = editor.selection;
        const code = editor.document.getText(selection);
        if (!code.trim()) {
            vscode.window.showWarningMessage("No code selected.");
            return;
        }
        try {
            const formatted = await (0, beautifyUtils_1.beautifyCode)(code, editor.document.languageId);
            editor.edit((editBuilder) => {
                editBuilder.replace(selection, formatted);
            });
            vscode.window.showInformationMessage("✅ Code beautified!");
        }
        catch (err) {
            vscode.window.showErrorMessage("⚠️ Could not format code: " + err.message);
        }
    }));
}
function deactivate() { }
