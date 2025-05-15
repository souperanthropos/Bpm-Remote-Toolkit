import * as vscode from 'vscode';
import path from 'path';
import { getDirectoryName, getNonce, isNullOrWhitespace } from '../../constants';
import { BpmnConverter } from './bpmn-converter';
import { parseStringPromise } from 'xml2js';
import { BpmnFormulaParserHelper } from './helpers/bpmnFormulaParserHelper';
import { BpmnFilterParserHelper } from './helpers/bpmnFilterParserHelper';
import { ConnectionConfig, EntitySchemaRequestManager } from '../../managers/entitySchemaRequestManager';
import { ProcessSchemaWrapper } from './processSchema';

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

	public static getParametersByElement(resources: Resource, path: string[]): Resource | string | undefined {
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
	private elementParameters: Record<string, ProcessElement> = {};
	private processMetadata = '';
	private sourceXml = '';

	constructor(private readonly _context: vscode.ExtensionContext,
		private readonly document: vscode.TextDocument
	) {
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
					const elementCaption = ProcessSchemaWrapper.getElementCaption(e.elementName);
					const settings = ProcessSchemaWrapper.getElementSettings(e.elementName);
					this.postMessage(this._webviewPanel, 'show-element-caption', {
						content: {
							name: e.elementName,
							caption: elementCaption,
							settings: settings
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
					<div class="modal-header" style="text-align: left;max">
						<p id="element-name"><strong>Name: &nbsp;</strong>
							<span id="element-name-value"></span>
						</p>
						<p id="element-caption"><strong>Caption: &nbsp;</strong>
							<span id="element-caption-value"></span>
						</p>
						<div id="element-parameters" style="display:none;">
							<div id="filter-display" style="display:none;">
								<p><strong>Filter: &nbsp;</strong>
									<br><br>
									<span id="filter-value"></span>
								</p>
							</div>
							<div id="сonditionalFlowValue-display" style="display:none;">
								<p><strong>Condition: &nbsp;</strong>
									<br><br>
									<span id="сonditionalFlow-value"></span>
								</p>
							</div>
							<div id="parameters-display" style="display:none;">
								<p><strong>Parameters: &nbsp;</strong></p>
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

	/*private processElementParameters(jsonData: any) {
		this.elementParameters = {};
		this.parameterMappings = {};

		if(jsonData.MetaData?.Schema?.BK15) {
			jsonData.MetaData.Schema.BK15.forEach((item: any) => {
				if (!this.parameterMappings[item.GT2]) {
					this.parameterMappings[item.GT2] = { elementName: item.A2, parameterId: item.GT3 };
				}
			});
		}
	
		if (jsonData.MetaData?.Schema?.BK4) {
			jsonData.MetaData.Schema.BK4.forEach((item: any) => {
				const elementName = item.A2 as string;
				if(elementName.includes('FormulaTask')){
					if (!this.elementParameters[elementName]) {
						this.elementParameters[elementName] = { parameters: {} };
					}
					//HS1 = 'a1caa860-48dc-4984-a1c0-de054f93c082'
					//CH1 = 'true'
				}else if(elementName.includes('ConditionalSequenceFlow')){
					if(item.CI3 !== undefined && item.CI3 !== "null"){
						if (!this.elementParameters[elementName]) {
							this.elementParameters[elementName] = { parameters: {} };
						}
						const parameterName = 'Condition';
						const elementParameterCaption = 'Условие перехода';
						const formulaParser = new BpmnFormulaParserHelper(item.CI3);
						const conditionValue = formulaParser.getConditionFormulaDisplayValue(this.elementCaptions, this.parameterMappings, this.elementParameters);
						this.elementParameters[elementName].condition = conditionValue;
						this.elementParameters[elementName].parameters[parameterName] = { 
							Uid: item.UId,
							Caption: elementParameterCaption, 
							DisplayValue: item.CI3
						};
					}
				}else if(item.BP2){
					item.BP2.forEach((subItem: any) => {
						const parameterName = subItem.A2;
						const parameterValue = subItem.L8.GS2 ?? "";

						if (!this.elementParameters[elementName]) {
							this.elementParameters[elementName] = { parameters: {} };
						}
						if(parameterName === 'DataSourceFilters'){
							if(!isNullOrWhitespace(parameterValue)){
								const filterParser = new BpmnFilterParserHelper(parameterValue);
								this.elementParameters[elementName].filter = filterParser.getFilterDisplayValue();
							}
						}else{
							const elementParameterCaption = Resource.getParametersByElement(
								this.groupedResources, 
								['BaseElements', elementName, 'Parameters', parameterName, 'Caption']
							) as string;
							const elementParameterValue = Resource.getParametersByElement(
								this.groupedResources, 
								['BaseElements', elementName, 'Parameters', parameterName, 'DisplayValue']
							) as string;
							this.elementParameters[elementName].parameters[parameterName] = { 
								Uid: subItem.UId,
								Caption: elementParameterCaption, 
								DisplayValue: elementParameterValue ?? parameterValue 
							};
						}
					});
				}
			});
		}
	}	*/

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

		ProcessSchemaWrapper.setMetadata(this.processMetadata, this.groupedResources["BaseElements"] as Resource);
		
		this.sourceXml = await BpmnConverter.convertToBpmn(ProcessSchemaWrapper.processSchema);
		this.postMessage(this._webviewPanel, 'update', {
			content: this.sourceXml,
			editable: true,
		});

		const conectionConfig = this._context.globalState.get<ConnectionConfig>('bpmnViewerConnectionConfig1');
		if(conectionConfig){
			const requestManager = new EntitySchemaRequestManager(conectionConfig);
			const data = await requestManager.getSchemasInfo();
			const schemaData = await requestManager.getSchemaData(
				{ 
					uId: "ecb16f49-82c6-4d4c-8b4c-bc3e2b41c29e", 
					packageUId: "94158239-125e-480f-a6a1-d3833516c0f8" 
				}
			);
		}
	}
}