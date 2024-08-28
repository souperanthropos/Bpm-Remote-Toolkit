import * as vscode from 'vscode';

export class FileManager {

    public async UpdateTimeInDescriptor(document: vscode.TextDocument) {
        const path = require("path");
        const fileStruct = path.parse(document.uri.fsPath);
        if(fileStruct.ext === '.cs' || fileStruct.ext === '.js'){
            const directory = fileStruct.dir;
            const descriptorFile = path.join(directory, 'descriptor.json');
    
            const readData = await vscode.workspace.fs.readFile(vscode.Uri.file(descriptorFile));
            let readStr = new TextDecoder('utf-8').decode(readData);
            readStr = readStr.replace('"ModifiedOnUtc": "\\/Date(1672091018000)\\/"', `"ModifiedOnUtc": "\\/Date(${Date.now()})\\/"`);
            await vscode.workspace.fs.writeFile(vscode.Uri.file(descriptorFile), new TextEncoder().encode(readStr));
        }
    }
}