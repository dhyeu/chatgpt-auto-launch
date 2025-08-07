import * as vscode from 'vscode';
import { buildPrompt } from './promptUtils';

export class ChatGPTSidebarProvider implements vscode.WebviewViewProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'public')]
    };

    webviewView.webview.html = await this.getHtml(webviewView.webview);

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

  private async getHtml(webview: vscode.Webview): Promise<string> {
    const htmlUri = vscode.Uri.joinPath(this.context.extensionUri, 'public', 'sidebar.html');
    const rawBytes = await vscode.workspace.fs.readFile(htmlUri);
    let html = Buffer.from(rawBytes).toString('utf8');

    // Convert relative asset paths to webview-safe URIs
    html = html.replace(/(src|href)="(.+?)"/g, (_match, attr, path) => {
      const resourceUri = webview.asWebviewUri(
        vscode.Uri.joinPath(this.context.extensionUri, 'public', path)
      );
      return `${attr}="${resourceUri}"`;
    });

    return html;
  }
}