import * as vscode from 'vscode';
import { getNonce, isNullOrWhitespace } from '../../constants';
import { BpmnConverter } from './bpmn-converter';
import { parseStringPromise } from 'xml2js';


export class Resource {
    [key: string]: string | Resource;

	public static traverse(obj: Resource, path: string[] = []) {
		Object.entries(obj).forEach(([key, value]) => {
			const newPath = [...path, key];
			if (typeof value === "object") {
				Resource.traverse(value as Resource, newPath);
			} else {
				console.log(`Путь: ${newPath.join('.')} -> Значение: ${value}`);
			}
		});
	}

    public static getElementsCaption(resources: Resource, elementName: string = ''): Record<string, string> {
		const captions: Record<string, string> = {};

		if(resources){
			Object.entries(resources).forEach(([key, value]) => {
				if(isNullOrWhitespace(elementName)){
					const newCaptions = Resource.getElementsCaption(value as Resource, key);
					Object.entries(newCaptions).forEach(([newKey, newValue]) => {
						captions[`${newKey}`] = newValue;
					});
				}else if(key === 'Caption') {
					captions[elementName] = value as string;
					return captions;
				}
			});
		}

        return captions;
    }
}

export class BpmnViewer {
	private readonly _webviewPanel: vscode.WebviewPanel;
	private groupedResources: Resource = {};
	private elementCaptions: Record<string, string> = {};
	private metadataJson = '';
	private sourceXml = '';

	constructor(private readonly _context: vscode.ExtensionContext) {
		this._webviewPanel = vscode.window.createWebviewPanel(
			'bpmnViewer',
			'BPMN Viewer',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		this._webviewPanel.webview.html = this.getHtmlForWebview(this._webviewPanel.webview);

		this._webviewPanel.webview.onDidReceiveMessage(e => {
			if (e.type === 'ready') {
				this.postMessage(this._webviewPanel, 'init', {
					content: this.sourceXml,
					editable: true,
				});
			}
			if(e.type === 'clicked-element'){
				if(e.elementName){
					const elementCaption = this.elementCaptions[e.elementName];
					this.postMessage(this._webviewPanel, 'show-element-caption', {
						content: {
							name: e.elementName,
							caption: elementCaption
						}
					});
				}
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

			<div id="propertyModal" class="modal" style="display:none;">
				<div class="modal-content">
					<span class="close-popup" style="text-align: right;">&times;</span>
					<div class="modal-header" style="text-align: left;">
						<p id="element-name"><strong>Name: &nbsp;</strong>
							<span id="element-name-value"></span>
						</p>
						<p id="element-caption"><strong>Caption: &nbsp;</strong>
							<span id="element-caption-value"></span>
						</p>
					</div>
				</div>
			</div>

            <script nonce="${nonce}" src="${scriptUri}"></script>
          </body>
          </html>`;
	}

	private async readResourceFromFile(uri: vscode.Uri){
		const readData = await vscode.workspace.fs.readFile(uri);
		const xml = new TextDecoder('utf-8').decode(readData);
		const result = await parseStringPromise(xml, { explicitArray: false });

		result.Resources.Group.Items.Item.forEach((item: any) => {
			const keys = item.$.Name.split('.');
			let current = this.groupedResources;

			for (let i = 0; i < keys.length - 1; i++) {
				current[keys[i]] = current[keys[i]] || {};
				current = current[keys[i]] as Resource;
			}

			current[keys[keys.length - 1]] = item.$.Value;
		});
		//const i = Resource.getElementsCaption(this.groupedResources["BaseElements"] as Resource);
		//traverse(i as Resource);
	}

	public async readMetadataFromFile(){
		await this.readResourceFromFile(vscode.Uri.joinPath(this._context.extensionUri, 'out', 'test', 'resource.ru-RU.xml'));
		this.elementCaptions = Resource.getElementsCaption(this.groupedResources["BaseElements"] as Resource);
		const readData = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(this._context.extensionUri, 'out', 'test', 'metadata.json'));
		this.metadataJson = new TextDecoder('utf-8').decode(readData);
		this.sourceXml = await BpmnConverter.convertToBpmn(JSON.parse(this.metadataJson).MetaData, this.elementCaptions);
		this.postMessage(this._webviewPanel, 'update', {
			content: this.sourceXml,
			editable: true,
		});
	}
}