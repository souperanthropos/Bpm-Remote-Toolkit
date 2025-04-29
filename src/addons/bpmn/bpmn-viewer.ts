import * as vscode from 'vscode';
import { getNonce, isNullOrWhitespace } from '../../constants';
import { BpmnConverter } from './bpmn-converter';
import { parseStringPromise } from 'xml2js';
import { BpmnFormulaParserHelper } from './bpmnFormulaParserHelper';

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
	private parameterMappings: Record<string, ParameterMapping> = {};
	private elementCaptions: Record<string, string> = {};
	private processMetadata = '';
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
							caption: elementCaption,
							settings: this.elementParameters[e.elementName]
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
						<div id="element-parameters">
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
	}

	private processElementParameters(jsonData: any) {
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
				const elementName = item.A2;
				if(item.BP2){
					item.BP2.forEach((subItem: any) => {
						const parameterName = subItem.A2;
						const parameterValue = subItem.L8.GS2 ?? "";

						if (!this.elementParameters[elementName]) {
							this.elementParameters[elementName] = { parameters: {} };
						}
						if(parameterName === 'DataSourceFilters'){
							if(!isNullOrWhitespace(parameterValue)){
								const formulaParser = new BpmnFormulaParserHelper(parameterValue);
								this.elementParameters[elementName].filter = formulaParser.getFilterDisplayValue();
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
				}else if(item.CI3 !== undefined && item.CI3 !== "null"){
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
			});
		}
	}	

	public async readMetadataFromFile(){
		await this.readResourceFromFile(vscode.Uri.joinPath(this._context.extensionUri, 'out', 'test', 'resource.ru-RU.xml'));
		const readData = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(this._context.extensionUri, 'out', 'test', 'metadata.json'));
		this.processMetadata = new TextDecoder('utf-8').decode(readData);
		this.elementCaptions = Resource.getElementsCaption(this.groupedResources["BaseElements"] as Resource);
		const processMetadataJson = JSON.parse(this.processMetadata);
		this.processElementParameters(processMetadataJson);
		this.sourceXml = await BpmnConverter.convertToBpmn(processMetadataJson.MetaData, this.elementCaptions);
		this.postMessage(this._webviewPanel, 'update', {
			content: this.sourceXml,
			editable: true,
		});
	}
}