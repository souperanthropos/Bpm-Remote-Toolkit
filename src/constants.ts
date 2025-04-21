import * as vscode from 'vscode';
import { Logger } from './common/logger';

export type OperationResult = { isSuccess: boolean, message: string };

export enum FolderType {
	default,
	terminal,
	package
}

interface ProcessSchemaElement {
	BL1: string;
	BL3: string;
	BN2: string;
	UId: string;
	CI1?: string;
	CI2?: string;
}

interface ProcessSchema {
	UId: string;
	A2: string;
	BK3?: Array<{ UId: string; BM4?: Array<{ UId: string }> }>;
	BK4?: ProcessSchemaElement[];
}

interface MetaData {
	Schema: ProcessSchema;
}

interface InputJson {
	MetaData: MetaData;
}

export async function jsonToBpmn(jsonData: InputJson): Promise<string> {
	var BpmnModdle = require('bpmn-moddle');
	var moddle = new BpmnModdle();

	// Создаем определения BPMN
	const definitions = moddle.create('bpmn:Definitions', {
		id: jsonData.MetaData.Schema.UId,
		targetNamespace: 'http://bpmn.io/schema/bpmn'
	});

	// Создаем процесс
	const process = moddle.create('bpmn:Process', {
		id: jsonData.MetaData.Schema.A2,
		isExecutable: true
	});
	definitions.get('rootElements').push(process);


	// Создаем диаграмму BPMN
	const diagram = moddle.create('bpmndi:BPMNDiagram', {
		id: `${jsonData.MetaData.Schema.UId}_Diagram`,
		plane: moddle.create('bpmndi:BPMNPlane', {
			id: `${jsonData.MetaData.Schema.UId}_Plane`,
			bpmnElement: process,
			planeElement: []
		})
	});
	definitions.get('rootElements').push(diagram);

	// Создаем набор дорожек
	/*jsonData.MetaData.Schema.BK3?.forEach(laneSetData => {
		const laneSet = moddle.create('bpmn:LaneSet', { id: laneSetData.UId });
		process.get('laneSets').push(laneSet);

		laneSetData.BM4?.forEach(laneData => {
			const lane = moddle.create('bpmn:Lane', { id: laneData.UId });
			laneSet.get('lanes').push(lane);
		});
	});*/

	// Создаем элементы процесса (события, потоки)
	const elements: Record<string, any> = {};
	jsonData.MetaData.Schema.BK4?.forEach(elementData => {
		let element;
		let shape;
		let bounds;

		switch (elementData.BL1) {
			case 'Terrasoft.Core.Process.ProcessSchemaStartEvent':
				element = moddle.create('bpmn:StartEvent', { id: `_${elementData.UId}` });
				elements[elementData.UId] = element;
				process.get('flowElements').push(element);
				const xy = elementData.BL3.split(';');
				const wh = elementData.BN2.split(';');
				bounds = moddle.create('dc:Bounds', {
					x: xy[0],
					y: xy[1],
					width: wh[0],
					height: wh[1]
				});
				shape = moddle.create('bpmndi:BPMNShape', {
					id: `_${elementData.UId}_di`,
					bpmnElement: element,
					bounds: bounds
				});
				diagram.plane.planeElement.push(shape);
				break;
			case 'Terrasoft.Core.Process.ProcessSchemaTerminateEvent':
				element = moddle.create('bpmn:EndEvent', { id: `_${elementData.UId}` });
				elements[elementData.UId] = element;
				process.get('flowElements').push(element);
				const xy1 = elementData.BL3.split(';');
				const wh1 = elementData.BN2.split(';');
				bounds = moddle.create('dc:Bounds', {
					x: xy1[0],
					y: xy1[1],
					width: wh1[0],
					height: wh1[1]
				});
				shape = moddle.create('bpmndi:BPMNShape', {
					id: `_${elementData.UId}_di`,
					bpmnElement: element,
					bounds: bounds
				});
				diagram.plane.planeElement.push(shape);
				break;
			case 'Terrasoft.Core.Process.ProcessSchemaSequenceFlow':
				if(elementData.CI1 && elementData.CI2){
					element = moddle.create('bpmn:SequenceFlow', {
						id: `_${elementData.UId}`,
						sourceRef: elements[elementData.CI1],
						targetRef: elements[elementData.CI2]
					});
					process.get('flowElements').push(element);
					shape = moddle.create('bpmndi:BPMNEdge', {
						id: `_${elementData.UId}_di`,
						bpmnElement: element
					});
					diagram.plane.planeElement.push(shape);
				}
				break;
		}
	});

	// Генерация XML
	const { xml } = await moddle.toXML(definitions);
	Logger.writeToChannel(xml);
	return xml;
}

export function getDirectoryName(localPath: string): string {
	const path = require("path");
	return path.basename(localPath);
}

export function isNullOrWhitespace(input: string | undefined) {
	return !input || !input.trim();
}

export const stringFormat = (str: string, ...args: string[]) =>
	str.replace(/{(\d+)}/g, (match, index) => args[index] || '');

export function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

export const hash = function () {
	if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
		const folder = vscode.workspace.workspaceFolders[0].uri.fsPath;
		const crypto = require('crypto');
		return crypto.createHash('md5').update(folder).digest('hex');
	}
	return '';
};

export const isMatchingWorkspace = function (sourcePath: string): boolean {
	const path = require('path');
	const wsFolder = vscode.workspace.workspaceFolders?.find(
		(wf) => {
			const relative = path.relative(wf.uri.fsPath, sourcePath);
			return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
		}
	);
	if (wsFolder) {
		return true;
	}
	return false;
};


export const showInformationMessage = (message: string, showbutton: boolean, executeLogFilePath: string | undefined) => {
	const buttonShowLog = showbutton ? "Show log file" : '';
	vscode.window.showInformationMessage(message, buttonShowLog)
		.then(selection => {
			if (selection === buttonShowLog && executeLogFilePath) {
				const folderUri = vscode.Uri.file(executeLogFilePath);
				vscode.commands.executeCommand(`vscode.openFolder`, folderUri);
			}
		});
};