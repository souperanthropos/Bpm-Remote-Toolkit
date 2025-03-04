import * as vscode from 'vscode';
import path from 'path';
import { DataTimeUtility } from '../common/utilities/dataTimeUtility';

export class FileManager {

    public async DeleteFile(filePath: string) {
        try{
            await vscode.workspace.fs.delete(vscode.Uri.file(filePath));
        }
        catch{}
    }

    public async appendToFile(filePath: string, content: string) {
        let readStr = '';
        try{
            const readData = await vscode.workspace.fs.readFile(vscode.Uri.file(filePath));
            readStr = new TextDecoder('utf-8').decode(readData);
        }
        catch{}
        if(readStr === ''){
            readStr += '\n';
        }
        readStr += DataTimeUtility.formatDate(new Date()) + ' - ' + content + '\n';
        await vscode.workspace.fs.writeFile(vscode.Uri.file(filePath), new TextEncoder().encode(readStr));
    }

    public async UpdateTimeInDescriptor(document: vscode.TextDocument) {
        const fileStruct = path.parse(document.uri.fsPath);
        if(fileStruct.ext === '.cs' || fileStruct.ext === '.js'){
            const directory = fileStruct.dir;
            const descriptorFile = path.join(directory, 'descriptor.json');
    
            const readData = await vscode.workspace.fs.readFile(vscode.Uri.file(descriptorFile));
            let readStr = new TextDecoder('utf-8').decode(readData);

            const pattern = /("ModifiedOnUtc": "\\\/Date\()([0-9]+)(\)\\\/")/;
            var updateStr = readStr.replace(pattern, `$1${DataTimeUtility.getUnixTimeWithoutMilliseconds(Date.now())}$3`);
            await vscode.workspace.fs.writeFile(vscode.Uri.file(descriptorFile), new TextEncoder().encode(updateStr));
        }
    }
}