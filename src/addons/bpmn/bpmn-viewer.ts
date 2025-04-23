import * as vscode from 'vscode';
import { getNonce } from '../../constants';
import { BpmnConverter } from './bpmn-converter';

export class BpmnViewer {
	private readonly _webviewPanel: vscode.WebviewPanel;
	private readonly _bpmnConverter: BpmnConverter;
	private metadataJson = '';
	private sourceXml = '';

	constructor(private readonly _context: vscode.ExtensionContext) {
		this._webviewPanel = vscode.window.createWebviewPanel(
			'bpmnViewer',
			'BPMN Viewer',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		this._bpmnConverter = new BpmnConverter();

		this._webviewPanel.webview.html = this.getHtmlForWebview(this._webviewPanel.webview);

		this._webviewPanel.webview.onDidReceiveMessage(e => {
			if (e.type === 'ready') {
				this.postMessage(this._webviewPanel, 'init', {
					content: this.sourceXml,
					editable: true,
				});
			}
		});
	}

	private postMessage(panel: vscode.WebviewPanel, type: string, body: any = {}): void {
		panel.webview.postMessage({ type, body });
	}

	private getHtmlForWebview(webview: vscode.Webview): string {

		// local path to script and css for the webview
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this._context.extensionUri, 'out/addons/bpmn/client', 'bpmn-viewer.js'));

		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this._context.extensionUri, 'media', 'reset.css'));

		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this._context.extensionUri, 'media', 'vscode.css'));

		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this._context.extensionUri, 'out/addons/bpmn/client', 'bpmn-viewer.css'));

		// use a nonce to whitelist which scripts can be run
		const nonce = getNonce();

		return /* html */`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
    
            <!--
            Use a content security policy to only allow loading images from https or from our extension directory,
            and only allow scripts that have a specific nonce.
            -->
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src https: 'self' data:; img-src ${webview.cspSource} blob:; style-src 'unsafe-inline' https: ${webview.cspSource}; script-src 'nonce-${nonce}';">
    
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleResetUri}" rel="stylesheet" />
            <link href="${styleVSCodeUri}" rel="stylesheet" />
            <link href="${styleMainUri}" rel="stylesheet" />
    
            <title>BPMN Editor</title>
          </head>
          <body>
            <div id="canvas"></div>
    
            <script nonce="${nonce}" src="${scriptUri}"></script>
          </body>
          </html>`;
	}

	public async readMetadataFromFile(uri: vscode.Uri){
		const readData = await vscode.workspace.fs.readFile(uri);
		this.metadataJson = new TextDecoder('utf-8').decode(readData);
		this.sourceXml = await this._bpmnConverter.convertToBpmn(JSON.parse(this.metadataJson).MetaData);
		this.postMessage(this._webviewPanel, 'update', {
			content: this.sourceXml,
			editable: true,
		});
	}
}