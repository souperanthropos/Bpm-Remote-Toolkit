import * as vscode from 'vscode';
import path from 'path';
import { getDirectoryName, getNonce, isNullOrWhitespace } from '../../constants';
import { BpmnConverter } from './bpmn-converter';
import { parseStringPromise } from 'xml2js';
import { ProcessSchemaWrapper } from './processSchema';
import { EntitySchemaRequestManager } from '../../managers/entitySchemaRequestManager';

export interface ParameterMapping {
	elementName: string;
	parameterId: string;
}

export interface ElementParameter {
	Uid: string;
	Caption: string;
	DisplayValue: string;
}

export interface ProcessElement {
    parameters: Record<string, ElementParameter>;
	condition?: string;
	filter?: string;
}

export class Resource {
    [key: string]: string | Resource;

	/*public static traverse(obj: Resource, path: string[] = []) {
		Object.entries(obj).forEach(([key, value]) => {
			const newPath = [...path, key];
			if (typeof value === "object") {
				Resource.traverse(value as Resource, newPath);
			} else {
				console.log(`Путь: ${newPath.join('.')} -> Значение: ${value}`);
			}
		});
	}*/

	private static getParametersByElement(resources: Resource, path: string[]): Resource | string | undefined {
		return path.reduce((acc: Resource | undefined, key) => {
			if (typeof acc === "object" && acc !== null && key in acc) {
				return acc[key] as Resource;
			}
			return undefined;
		}, resources as Resource) as Resource | string | undefined;
	}

	public static getParameters(resources: Resource, elementName: string = ''): Record<string, string> {
		const elementParameters: Record<string, string> = {};
		const parameters = Resource.getParametersByElement(resources, ['BaseElements', elementName, 'Parameters']);
		if(parameters && typeof parameters === 'object') {
			Object.entries(parameters).forEach(([newKey, newValue]) => {
				Object.entries(newValue).forEach(([newKey, newValue]) => {
					elementParameters[`${newKey}`] = newValue as string;
				});
			});
		}
		return elementParameters;
	}

	public static getParameterCaption(resources: Resource, elementName: string, parameterName: string): string {
		return Resource.getParametersByElement(resources, [elementName, 'Parameters', parameterName, 'Caption']) as string;
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
	private processSchemaWrapper?: ProcessSchemaWrapper;
	private processMetadata = '';
	private sourceXml = '';

	constructor(private readonly _context: vscode.ExtensionContext,
		private readonly document: vscode.TextDocument,
		private readonly requestManager?: EntitySchemaRequestManager
	) {
		this._webviewPanel = vscode.window.createWebviewPanel(
			'bpmnViewer',
			'BPMN Viewer',
			vscode.ViewColumn.One,
			{ enableScripts: true }
		);

		this._webviewPanel.webview.html = this.getHtmlForWebview(this._webviewPanel.webview);

		this._webviewPanel.webview.onDidReceiveMessage(async e => {
			if (e.type === 'ready') {
				/*this.postMessage(this._webviewPanel, 'init', {
					content: this.sourceXml,
					editable: true,
				});*/
			}
			if(e.type === 'clicked-element'){
				if(e.elementName){
					const elementCaption = this.processSchemaWrapper!.getElementCaption(e.elementName);
					this.postMessage(this._webviewPanel, 'show-loadingMask');
					try{
						const settings = await this.processSchemaWrapper!.getElementSettings(e.elementName);
						this.postMessage(this._webviewPanel, 'show-element-caption', {
							content: {
								name: e.elementName,
								caption: elementCaption,
								settings: settings
							}
						});
					}catch(e){
						this.postMessage(this._webviewPanel, 'hide-loadingMask');
					}
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
		  	<div id="loading-mask" style="display:none;">
				<div class="loader"></div>
			</div>
            <div id="canvas"></div>

			<div id="propertyModal" class="modal" style="display:none;">
				<div class="modal-content">
					<span class="close-popup" style="text-align: right;">&times;</span>
					<div class="modal-header" style="text-align: left;max">
						<p id="element-name"><strong>Name: &nbsp;</strong>
							<span id="element-name-value"></span>
						</p>
						<p id="element-caption"><strong>Caption: &nbsp;</strong>
							<span id="element-caption-value"></span>
						</p>
						<div id="element-parameters" style="display:none;">
							<div id="filter-display" style="display:none;">
							</div>
							<div id="сonditionalFlowValue-display" style="display:none;">
								<p><strong>Condition: &nbsp;</strong>
									<br><br>
									<span id="сonditionalFlow-value"></span>
								</p>
							</div>
							<div id="parameters-display" style="display:none;">
								<p><strong>Parameters:</strong></p>
								<ul id="parameters-list"></ul>
							</div>
						</div>
						<div id="code-block-display" style="display:none;">
							<pre><code id="code-block" class="language-csharp"></code></pre>
						</div>
					</div>
				</div>
			</div>

            <script nonce="${nonce}" src="${scriptUri}"></script>
          </body>
          </html>`;
	}

	private getProcessResourceFileUri(processPath: string): vscode.Uri {
		const processDirectoryPath = path.dirname(processPath);
		const processName = getDirectoryName(processDirectoryPath);
		const processresourcePath = path.join(processDirectoryPath, '..', '..', 'Resources', processName + '.Process', 'resource.ru-RU.xml');
		return vscode.Uri.file(processresourcePath);
	}

	private async readResourceFromFile(processPath: string){
		const resourceUri = this.getProcessResourceFileUri(processPath);
		const readData = await vscode.workspace.fs.readFile(resourceUri);
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
	}

	public async renderDiagram(){
		await this.readResourceFromFile(this.document.uri.path);
		this.processMetadata = this.document.getText();
		this.processSchemaWrapper = new ProcessSchemaWrapper(
			this.processMetadata, 
			this.groupedResources["BaseElements"] as Resource, 
			this.requestManager
		);
		this.sourceXml = await BpmnConverter.convertToBpmn(this.processSchemaWrapper);
		this.postMessage(this._webviewPanel, 'update', {
			content: this.sourceXml,
			editable: true,
		});
	}
}