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

            const pattern = /("ModifiedOnUtc": "\\\/Date\()([0-9]+)(\)\\\/")/;
            var updateStr = readStr.replace(pattern, `$1${this.getUnixTimeWithoutMilliseconds()}$3`);
            await vscode.workspace.fs.writeFile(vscode.Uri.file(descriptorFile), new TextEncoder().encode(updateStr));
        }
    }

    getUnixTimeWithoutMilliseconds(): string {
        const time = Math.floor(Date.now() / 1000) * 1000;
        return time.toString();
    }
}