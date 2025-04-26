/* global acquireVsCodeApi */

import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';

import './bpmn-viewer.css';

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
			closeModal();
			if (!body.content) {
				return viewer.createDiagram();
			} else {
				return viewer.importXML(body.content);
			}

		case 'update': {
			if (body.content) {
				return viewer.importXML(body.content);
			}

			if (body.undo) {
				return viewer.get('commandStack').undo();
			}

			if (body.redo) {
				return viewer.get('commandStack').redo();
			}

			break;
		}

		case 'show-element-caption': {
			document.getElementById("propertyModal").style.display = "flex";
			const modalText = document.querySelector("#propertyModal p");
			modalText.textContent = body.caption;
			break;
		}

		case 'focusCanvas':
			viewer.get('canvas').focus();
			return;
	}
});

// signal to VS Code that the webview is initialized
vscode.postMessage({ type: 'ready' });
