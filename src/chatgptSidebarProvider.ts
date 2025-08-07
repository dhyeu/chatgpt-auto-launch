import * as vscode from 'vscode';
import * as fs from 'fs';
import { buildPrompt } from './promptUtils';

export class ChatGPTSidebarProvider implements vscode.WebviewViewProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'sendPrompt') {
        let finalPrompt = message.prompt;

        if (finalPrompt === 'EXPLAIN' || finalPrompt === 'REFACTOR') {
          const editor = vscode.window.activeTextEditor;
          if (!editor) return;

          const selected = editor.document.getText(editor.selection);
          if (!selected.trim()) return;

          finalPrompt = buildPrompt(
            finalPrompt === 'EXPLAIN' ? "explain" : "refactor",
            selected,
            editor.document
          );

          await this.context.globalState.update("lastPrompt", finalPrompt);
        }

        if (finalPrompt) {
          const encoded = encodeURIComponent(finalPrompt);
          vscode.env.openExternal(
            vscode.Uri.parse(`https://chat.openai.com/?q=${encoded}`)
          );
        }
      }

      if (message.command === 'sendLastPrompt') {
        const lastPrompt = this.context.globalState.get<string>("lastPrompt");
        if (!lastPrompt) {
          vscode.window.showInformationMessage("No previous prompt found.");
          return;
        }

        const encoded = encodeURIComponent(lastPrompt);
        vscode.env.openExternal(
          vscode.Uri.parse(`https://chat.openai.com/?q=${encoded}`)
        );
      }

      if (message.command === 'beautifyCode') {
        vscode.commands.executeCommand('chatgptAutoLaunch.beautifyCode');
      }
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'public', 'sidebar.html');
    let html = fs.readFileSync(htmlPath.fsPath, 'utf8');

    // Resolve asset paths (for any images, CSS, etc.)
    html = html.replace(/(src|href)="(.+?)"/g, (_match: string, attr: string, path: string) => {
      const resourceUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this.context.extensionUri, 'public', path)
      );
      return `${attr}="${resourceUri}"`;
    });

    return html;
  }
}