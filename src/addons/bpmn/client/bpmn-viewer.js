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


// handle messages from the extension
window.addEventListener('message', async (event) => {

	const {
		type,
		body,
		requestId
	} = event.data;

	switch (type) {
		case 'init':
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

		case 'getText':
			return viewer.saveXML({ format: true }).then(({ xml }) => {
				return vscode.postMessage({
					type: 'response',
					requestId,
					body: xml
				});
			});

		case 'focusCanvas':
			viewer.get('canvas').focus();
			return;
	}
});

// signal to VS Code that the webview is initialized
vscode.postMessage({ type: 'ready' });
