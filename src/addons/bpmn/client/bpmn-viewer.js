/* global acquireVsCodeApi */

import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';

import './bpmn-viewer.css';

import Prism from 'prismjs';
import 'prismjs/components/prism-csharp';
import "prismjs/themes/prism.css";

import BpmnNavigatedViewer from 'bpmn-js/lib/NavigatedViewer';

import { handleMacOsKeyboard } from './utils/macos-keyboard';

/**
 * @type { import('vscode') }
 */
const vscode = acquireVsCodeApi();

handleMacOsKeyboard();

const viewer = new BpmnNavigatedViewer({
	container: '#canvas'
});

viewer.on('import.done', event => {
	const eventBus = viewer.get('eventBus');
	const selection = viewer.get('selection');

	eventBus.on('element.click', (event) => {
		const element = event.element;
		if (element) {

			/*const gfx = viewer.get('canvas').getGraphics(element);
			if (!gfx) {
				return; // Проверяем, что графический элемент существует
			}

			const path = gfx.querySelector('path') || gfx.querySelector('polygon') || gfx.querySelector('rect') || gfx.querySelector('polyline');
			if (!path) {
				return; // Проверяем, что нашли нужный элемент
			}

			path.style.cssText += 'stroke: green !important;';*/

			selection.select(element);
			console.log('Открываем окно свойств для:', element);
			const elementName = element.businessObject.get("customProperty");
			if (elementName) {
				console.log('Custom Property:', elementName);
				return vscode.postMessage({
					type: 'clicked-element',
					elementName: elementName
				});
			} else {
				console.log('No custom property found.');
			}
		}
	});

	return vscode.postMessage({
		type: 'import',
		error: event.error?.message,
		warnings: event.warnings.map(warning => warning.message),
		idx: -1
	});
});

viewer.on('commandStack.changed', () => {

	/**
	 * @type { import('diagram-js/lib/command/CommandStack').default }
	 */
	const commandStack = viewer.get('commandStack');

	return vscode.postMessage({
		type: 'change',
		idx: commandStack._stackIdx
	});
});

viewer.on('canvas.focus.changed', (event) => {
	return vscode.postMessage({
		type: 'canvas-focus-change',
		value: event.focused
	});
});

let closePopupButton = document.querySelector('.close-popup');
closePopupButton.addEventListener('click',() => {
	document.getElementById("propertyModal").style.display = "none";
});
document.addEventListener('click', (e) => {
	const modal = document.getElementById("propertyModal");
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

// handle messages from the extension
window.addEventListener('message', async (event) => {

	const {
		type,
		body,
	} = event.data;

	switch (type) {
		case 'init':
			if (body.content) {
				return viewer.importXML(body.content);
			} 
			break;
		case 'update': {
			if (body.content) {
				return viewer.importXML(body.content);
			}
			break;
		}

		case 'show-element-caption': {
			document.getElementById("element-name-value").innerHTML = body.content.name;
			document.getElementById("element-caption-value").innerHTML = body.content.caption ?? `[Нет данных]`;
			if(body.content.settings) {
				render(body.content.settings);
			}else{
				document.getElementById("element-parameters").style.display = "none";
				document.getElementById("code-block-display").style.display = "none";
			}
			document.getElementById("propertyModal").style.display = "flex";
			break;
		}

		case 'show-loadingMask':
			document.getElementById('loading-mask').style.display = 'flex';
			return;

		case 'hide-loadingMask':
			document.getElementById('loading-mask').style.display = 'none';
			return;

		case 'focusCanvas':
			viewer.get('canvas').focus();
			return;
	}
});

function render(settings) {
	document.getElementById('loading-mask').style.display = 'none';
	if(settings.script){
		document.getElementById("code-block").innerHTML = Prism.highlight(settings.script, Prism.languages.csharp, 'csharp');
		document.getElementById("code-block-display").style.display = "flex";
		document.getElementById("element-parameters").style.display = "none";
	}else{
		document.getElementById("element-parameters").style.display = "flex";
		document.getElementById("code-block-display").style.display = "none";
		document.getElementById("code-block").innerHTML = '';
	}

	if(settings.filter) {
		document.getElementById("filter-display").innerHTML = settings.filter;
		document.getElementById("filter-display").style.display = "flex";
	}else{
		document.getElementById("filter-display").style.display = "none";
	}

	document.getElementById("parameters-display").style.display = "none";
	if(settings.parameters){
		const parametersList = document.getElementById("parameters-list");
    	parametersList.innerHTML = "";
		Object.keys(settings.parameters).forEach(key => {
			const param = settings.parameters[key];
			const listItem = document.createElement("li");
			listItem.innerHTML = `
				<span class="key">${key}: </span><div class="value">${param}</div></li>
			`;
			parametersList.appendChild(listItem);
		});
		if(parametersList.appendChild.length > 0){
			document.getElementById("parameters-display").style.display = "flex";
		}
	}

	if(settings.condition) {
		document.getElementById("сonditionalFlowValue-display").style.display = "flex";
		document.getElementById("сonditionalFlow-value").innerHTML = settings.condition;
	}else{
		document.getElementById("сonditionalFlowValue-display").style.display = "none";
	}
}

// signal to VS Code that the webview is initialized
vscode.postMessage({ type: 'ready' });
