import * as vscode from 'vscode';
import { getNonce } from './constants';

export class BpmnViewer {
	private readonly _webviewPanel: vscode.WebviewPanel;

	private sourceXml = `
    <?xml version="1.0" encoding="UTF-8"?>
    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" targetNamespace="" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL http://www.omg.org/spec/BPMN/2.0/20100501/BPMN20.xsd">
      <collaboration id="sid-c0e745ff-361e-4afb-8c8d-2a1fc32b1424">
        <participant id="sid-87F4C1D6-25E1-4A45-9DA7-AD945993D06F" name="Customer" processRef="sid-C3803939-0872-457F-8336-EAE484DC4A04" />
      </collaboration>
      <process id="sid-C3803939-0872-457F-8336-EAE484DC4A04" name="Customer" processType="None" isClosed="false" isExecutable="false">
        <extensionElements />
        <laneSet id="sid-b167d0d7-e761-4636-9200-76b7f0e8e83a">
          <lane id="sid-57E4FE0D-18E4-478D-BC5D-B15164E93254">
            <flowNodeRef>sid-52EB1772-F36E-433E-8F5B-D5DFD26E6F26</flowNodeRef>
            <flowNodeRef>sid-E49425CF-8287-4798-B622-D2A7D78EF00B</flowNodeRef>
            <flowNodeRef>sid-D7F237E8-56D0-4283-A3CE-4F0EFE446138</flowNodeRef>
            <flowNodeRef>sid-E433566C-2289-4BEB-A19C-1697048900D2</flowNodeRef>
            <flowNodeRef>sid-5134932A-1863-4FFA-BB3C-A4B4078B11A9</flowNodeRef>
            <flowNodeRef>SCAN_OK</flowNodeRef>
          </lane>
        </laneSet>
        <task id="sid-52EB1772-F36E-433E-8F5B-D5DFD26E6F26" name="Scan QR code">
          <incoming>sid-4DC479E5-5C20-4948-BCFC-9EC5E2F66D8D</incoming>
          <outgoing>sid-EE8A7BA0-5D66-4F8B-80E3-CC2751B3856A</outgoing>
        </task>
        <task id="sid-E49425CF-8287-4798-B622-D2A7D78EF00B" name="Open product information in mobile  app">
          <incoming>sid-8B820AF5-DC5C-4618-B854-E08B71FB55CB</incoming>
          <outgoing>sid-57EB1F24-BD94-479A-BF1F-57F1EAA19C6C</outgoing>
        </task>
        <startEvent id="sid-D7F237E8-56D0-4283-A3CE-4F0EFE446138" name="Notices&#10;QR code">
          <outgoing>sid-7B791A11-2F2E-4D80-AFB3-91A02CF2B4FD</outgoing>
        </startEvent>
        <endEvent id="sid-E433566C-2289-4BEB-A19C-1697048900D2" name="Is informed">
          <incoming>sid-57EB1F24-BD94-479A-BF1F-57F1EAA19C6C</incoming>
        </endEvent>
        <exclusiveGateway id="sid-5134932A-1863-4FFA-BB3C-A4B4078B11A9">
          <incoming>sid-7B791A11-2F2E-4D80-AFB3-91A02CF2B4FD</incoming>
          <incoming>sid-337A23B9-A923-4CCE-B613-3E247B773CCE</incoming>
          <outgoing>sid-4DC479E5-5C20-4948-BCFC-9EC5E2F66D8D</outgoing>
        </exclusiveGateway>
        <exclusiveGateway id="SCAN_OK" name="Scan successful?&#10;">
          <incoming>sid-EE8A7BA0-5D66-4F8B-80E3-CC2751B3856A</incoming>
          <outgoing>sid-8B820AF5-DC5C-4618-B854-E08B71FB55CB</outgoing>
          <outgoing>sid-337A23B9-A923-4CCE-B613-3E247B773CCE</outgoing>
        </exclusiveGateway>
        <sequenceFlow id="sid-337A23B9-A923-4CCE-B613-3E247B773CCE" name="Yes" sourceRef="SCAN_OK" targetRef="sid-5134932A-1863-4FFA-BB3C-A4B4078B11A9" />
        <sequenceFlow id="sid-4DC479E5-5C20-4948-BCFC-9EC5E2F66D8D" sourceRef="sid-5134932A-1863-4FFA-BB3C-A4B4078B11A9" targetRef="sid-52EB1772-F36E-433E-8F5B-D5DFD26E6F26" />
        <sequenceFlow id="sid-8B820AF5-DC5C-4618-B854-E08B71FB55CB" name="No" sourceRef="SCAN_OK" targetRef="sid-E49425CF-8287-4798-B622-D2A7D78EF00B" />
        <sequenceFlow id="sid-57EB1F24-BD94-479A-BF1F-57F1EAA19C6C" sourceRef="sid-E49425CF-8287-4798-B622-D2A7D78EF00B" targetRef="sid-E433566C-2289-4BEB-A19C-1697048900D2" />
        <sequenceFlow id="sid-EE8A7BA0-5D66-4F8B-80E3-CC2751B3856A" sourceRef="sid-52EB1772-F36E-433E-8F5B-D5DFD26E6F26" targetRef="SCAN_OK" />
        <sequenceFlow id="sid-7B791A11-2F2E-4D80-AFB3-91A02CF2B4FD" sourceRef="sid-D7F237E8-56D0-4283-A3CE-4F0EFE446138" targetRef="sid-5134932A-1863-4FFA-BB3C-A4B4078B11A9" />
      </process>
      <bpmndi:BPMNDiagram id="sid-74620812-92c4-44e5-949c-aa47393d3830">
        <bpmndi:BPMNPlane id="sid-cdcae759-2af7-4a6d-bd02-53f3352a731d" bpmnElement="sid-c0e745ff-361e-4afb-8c8d-2a1fc32b1424">
          <bpmndi:BPMNShape id="sid-87F4C1D6-25E1-4A45-9DA7-AD945993D06F_gui" bpmnElement="sid-87F4C1D6-25E1-4A45-9DA7-AD945993D06F" isHorizontal="true">
            <omgdc:Bounds x="83" y="105" width="933" height="250" />
            <bpmndi:BPMNLabel labelStyle="sid-84cb49fd-2f7c-44fb-8950-83c3fa153d3b">
              <omgdc:Bounds x="47.49999999999999" y="170.42857360839844" width="12.000000000000014" height="59.142852783203125" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNShape>
          <bpmndi:BPMNShape id="sid-57E4FE0D-18E4-478D-BC5D-B15164E93254_gui" bpmnElement="sid-57E4FE0D-18E4-478D-BC5D-B15164E93254" isHorizontal="true">
            <omgdc:Bounds x="113" y="105" width="903" height="250" />
          </bpmndi:BPMNShape>
          <bpmndi:BPMNShape id="sid-52EB1772-F36E-433E-8F5B-D5DFD26E6F26_gui" bpmnElement="sid-52EB1772-F36E-433E-8F5B-D5DFD26E6F26">
            <omgdc:Bounds x="393" y="170" width="100" height="80" />
            <bpmndi:BPMNLabel labelStyle="sid-84cb49fd-2f7c-44fb-8950-83c3fa153d3b">
              <omgdc:Bounds x="360.5" y="172" width="84" height="12" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNShape>
          <bpmndi:BPMNShape id="sid-E49425CF-8287-4798-B622-D2A7D78EF00B_gui" bpmnElement="sid-E49425CF-8287-4798-B622-D2A7D78EF00B">
            <omgdc:Bounds x="728" y="170" width="100" height="80" />
            <bpmndi:BPMNLabel labelStyle="sid-84cb49fd-2f7c-44fb-8950-83c3fa153d3b">
              <omgdc:Bounds x="695.9285736083984" y="162" width="83.14285278320312" height="36" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNShape>
          <bpmndi:BPMNEdge id="sid-EE8A7BA0-5D66-4F8B-80E3-CC2751B3856A_gui" bpmnElement="sid-EE8A7BA0-5D66-4F8B-80E3-CC2751B3856A">
            <omgdi:waypoint x="493" y="210" />
            <omgdi:waypoint x="585" y="210" />
            <bpmndi:BPMNLabel>
              <omgdc:Bounds x="494" y="185" width="90" height="20" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNEdge>
          <bpmndi:BPMNEdge id="sid-8B820AF5-DC5C-4618-B854-E08B71FB55CB_gui" bpmnElement="sid-8B820AF5-DC5C-4618-B854-E08B71FB55CB">
            <omgdi:waypoint x="635" y="210" />
            <omgdi:waypoint x="728" y="210" />
            <bpmndi:BPMNLabel labelStyle="sid-e0502d32-f8d1-41cf-9c4a-cbb49fecf581">
              <omgdc:Bounds x="642" y="185" width="16" height="12" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNEdge>
          <bpmndi:BPMNEdge id="sid-7B791A11-2F2E-4D80-AFB3-91A02CF2B4FD_gui" bpmnElement="sid-7B791A11-2F2E-4D80-AFB3-91A02CF2B4FD">
            <omgdi:waypoint x="223" y="210" />
            <omgdi:waypoint x="275" y="210" />
            <bpmndi:BPMNLabel>
              <omgdc:Bounds x="204" y="185" width="90" height="20" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNEdge>
          <bpmndi:BPMNEdge id="sid-4DC479E5-5C20-4948-BCFC-9EC5E2F66D8D_gui" bpmnElement="sid-4DC479E5-5C20-4948-BCFC-9EC5E2F66D8D">
            <omgdi:waypoint x="325" y="210" />
            <omgdi:waypoint x="393" y="210" />
            <bpmndi:BPMNLabel>
              <omgdc:Bounds x="314" y="185" width="90" height="20" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNEdge>
          <bpmndi:BPMNEdge id="sid-57EB1F24-BD94-479A-BF1F-57F1EAA19C6C_gui" bpmnElement="sid-57EB1F24-BD94-479A-BF1F-57F1EAA19C6C">
            <omgdi:waypoint x="828" y="210" />
            <omgdi:waypoint x="901" y="210" />
            <bpmndi:BPMNLabel>
              <omgdc:Bounds x="820" y="185" width="90" height="20" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNEdge>
          <bpmndi:BPMNEdge id="sid-337A23B9-A923-4CCE-B613-3E247B773CCE_gui" bpmnElement="sid-337A23B9-A923-4CCE-B613-3E247B773CCE">
            <omgdi:waypoint x="611" y="234" />
            <omgdi:waypoint x="610.5" y="299" />
            <omgdi:waypoint x="300.5" y="299" />
            <omgdi:waypoint x="301" y="234" />
            <bpmndi:BPMNLabel labelStyle="sid-e0502d32-f8d1-41cf-9c4a-cbb49fecf581">
              <omgdc:Bounds x="585" y="236" width="21" height="12" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNEdge>
          <bpmndi:BPMNShape id="StartEvent_0l6sgn0_di" bpmnElement="sid-D7F237E8-56D0-4283-A3CE-4F0EFE446138">
            <omgdc:Bounds x="187" y="192" width="36" height="36" />
            <bpmndi:BPMNLabel>
              <omgdc:Bounds x="182" y="229" width="46" height="24" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNShape>
          <bpmndi:BPMNShape id="EndEvent_0xwuvv5_di" bpmnElement="sid-E433566C-2289-4BEB-A19C-1697048900D2">
            <omgdc:Bounds x="901" y="192" width="36" height="36" />
            <bpmndi:BPMNLabel>
              <omgdc:Bounds x="892" y="231" width="56" height="12" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNShape>
          <bpmndi:BPMNShape id="ExclusiveGateway_1g0eih2_di" bpmnElement="sid-5134932A-1863-4FFA-BB3C-A4B4078B11A9" isMarkerVisible="true">
            <omgdc:Bounds x="275" y="185" width="50" height="50" />
            <bpmndi:BPMNLabel>
              <omgdc:Bounds x="210" y="160" width="90" height="12" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNShape>
          <bpmndi:BPMNShape id="ExclusiveGateway_0vci1x5_di" bpmnElement="SCAN_OK" isMarkerVisible="true">
            <omgdc:Bounds x="585" y="185" width="50" height="50" />
            <bpmndi:BPMNLabel>
              <omgdc:Bounds x="568" y="157" width="88" height="24" />
            </bpmndi:BPMNLabel>
          </bpmndi:BPMNShape>
        </bpmndi:BPMNPlane>
        <bpmndi:BPMNLabelStyle id="sid-e0502d32-f8d1-41cf-9c4a-cbb49fecf581">
          <omgdc:Font name="Arial" size="11" isBold="false" isItalic="false" isUnderline="false" isStrikeThrough="false" />
        </bpmndi:BPMNLabelStyle>
        <bpmndi:BPMNLabelStyle id="sid-84cb49fd-2f7c-44fb-8950-83c3fa153d3b">
          <omgdc:Font name="Arial" size="12" isBold="false" isItalic="false" isUnderline="false" isStrikeThrough="false" />
        </bpmndi:BPMNLabelStyle>
      </bpmndi:BPMNDiagram>
    </definitions>
                `;

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
		});
	}

	private postMessage(panel: vscode.WebviewPanel, type: string, body: any = {}): void {
		panel.webview.postMessage({ type, body });
	}

	private getHtmlForWebview(webview: vscode.Webview): string {

		// local path to script and css for the webview
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this._context.extensionUri, 'out/client', 'bpmn-viewer.js'));

		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this._context.extensionUri, 'media', 'reset.css'));

		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this._context.extensionUri, 'media', 'vscode.css'));

		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this._context.extensionUri, 'out/client', 'bpmn-viewer.css'));

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

	public convertToBPMN(jsonData: any) {
		const xmlTemplate = require("bpmn-js-xml-templater");

		let template = new xmlTemplate();

		let firstShape = template.addShape(80, 100, 100, 150, "First element");
		let secondShape = template.addShape(80, 100, 350, 150, "Second element");
		let thirdShape = template.addShape(80, 100, 560, 350, "Third element");
		let fourthShape = template.addShape(80, 100, 560, 150, "Fourth element");

		template.connect(firstShape, secondShape);
		template.connect(secondShape, thirdShape);
		template.connect(thirdShape, fourthShape);

		this.sourceXml = template.xml;
	}
}