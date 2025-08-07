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
exports.ChatGPTSidebarProvider = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const promptUtils_1 = require("./promptUtils");
class ChatGPTSidebarProvider {
    constructor(context) {
        this.context = context;
    }
    resolveWebviewView(webviewView) {
        webviewView.webview.options = {
            enableScripts: true
        };
        webviewView.webview.html = this.getHtml(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(async (message) => {
            if (message.command === 'sendPrompt') {
                let finalPrompt = message.prompt;
                if (finalPrompt === 'EXPLAIN' || finalPrompt === 'REFACTOR') {
                    const editor = vscode.window.activeTextEditor;
                    if (!editor)
                        return;
                    const selected = editor.document.getText(editor.selection);
                    if (!selected.trim())
                        return;
                    finalPrompt = (0, promptUtils_1.buildPrompt)(finalPrompt === 'EXPLAIN' ? "explain" : "refactor", selected, editor.document);
                    await this.context.globalState.update("lastPrompt", finalPrompt);
                }
                if (finalPrompt) {
                    const encoded = encodeURIComponent(finalPrompt);
                    vscode.env.openExternal(vscode.Uri.parse(`https://chat.openai.com/?q=${encoded}`));
                }
            }
            if (message.command === 'sendLastPrompt') {
                const lastPrompt = this.context.globalState.get("lastPrompt");
                if (!lastPrompt) {
                    vscode.window.showInformationMessage("No previous prompt found.");
                    return;
                }
                const encoded = encodeURIComponent(lastPrompt);
                vscode.env.openExternal(vscode.Uri.parse(`https://chat.openai.com/?q=${encoded}`));
            }
            if (message.command === 'beautifyCode') {
                vscode.commands.executeCommand('chatgptAutoLaunch.beautifyCode');
            }
        });
    }
    getHtml(webview) {
        const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'public', 'sidebar.html');
        let html = fs.readFileSync(htmlPath.fsPath, 'utf8');
        // Resolve asset paths (for any images, CSS, etc.)
        html = html.replace(/(src|href)="(.+?)"/g, (_match, attr, path) => {
            const resourceUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'public', path));
            return `${attr}="${resourceUri}"`;
        });
        return html;
    }
}
exports.ChatGPTSidebarProvider = ChatGPTSidebarProvider;
