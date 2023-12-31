// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) { 

 	let disposable = vscode.commands.registerCommand('extension.SmartImporter', function () {
        const editor = vscode.window.activeTextEditor; 

        if (editor) {
            // Get the selected text 
			const lineNumber = editor.selection.active.line;
			// Get the entire line's text
			const lineText = editor.document.lineAt(lineNumber).text;
			const match = !lineText.includes('from') ? lineText.replace(/(import|')/g, '').trim() : lineText.match(/import (\{.*\}|\w+) from ['"](.+)['"]/);  
  
            if (match && match.length >= 2) { 
				const currentFile = editor.document.uri.fsPath
				const filePath = match[2].length > 1 ? match[2] : String(match)
				const filePathSplitted = !filePath.endsWith('/') ? filePath.split('/') : undefined
                const fileName = filePathSplitted === undefined ? filePathSplitted : match[2].length > 1 ? filePathSplitted[filePathSplitted.length - 1] + path.extname(currentFile) : !filePathSplitted[filePathSplitted.length - 1].includes('.') ? filePathSplitted[filePathSplitted.length - 1] + path.extname(currentFile) : filePathSplitted[filePathSplitted.length - 1]; 
                const componentNameRaw = match[1]
                
                const componentName = match[1].includes('}') ? match[1].replace(/({|})/g, '').split(',') : [match[1].replace("'", '')   ]
				if(filePath && isRelativePath(filePath)) { 
				// Create the folder and file 
					const rootPath = path.dirname(currentFile)
            	    createFolderAndFile(rootPath, filePath, fileName, componentName,componentNameRaw);
				} 
            } 
		} 
	});
 

	context.subscriptions.push(disposable);

    vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.activeTextEditor;  
        if (editor && event.document === editor.document) {
            // Getting selected text
            const lineNumber = editor.selection.active.line; 
            const currentLine =  editor.document.lineAt(lineNumber).text; 
 
            const lineChanged = event.contentChanges[0].text  
            const lineSplitted = currentLine.trim().split(' ')
            
            const lineCheck = currentLine.includes('import') ? !currentLine.includes('from') ? true : lineSplitted[lineSplitted.length - 1] !== 'from' ? true : false : false
            // Trigger the command if the next line is empty (user pressed Enter at the end)
            if (lineCheck && lineChanged === '\r\n') { 
                vscode.commands.executeCommand('extension.SmartImporter');
            }
        }
    }); 
}
function isRelativePath(filePath) {
    // Check if the file path is relative (starts with a dot or a slash)
    return filePath.startsWith('.') || filePath.startsWith('/');
}
function createFolderAndFile(rootPath, filePath, fileName, componentName, componentNameRaw) {
    if (fileName) {
        const folderPath = filePath.endsWith('/') ? filePath : path.dirname(filePath);
        const fullFolderPath = path.join(rootPath, folderPath);
        const fullFilePath = path.join(fullFolderPath, fileName);

        // Check if the folder exists, create it if not
        if (!fs.existsSync(fullFolderPath)) {
            fs.mkdirSync(fullFolderPath, { recursive: true }); 
        }

    // Check if the file exists, create it if not 
        if (!fs.existsSync(fullFilePath) ) { 
            let exportText = componentName.length > 1 ? `\n\nexport {${componentName.join(',')}};\n` : `\n\nexport default ${componentName.join('')};\n`;
            if(fileName.split('.')[1] === 'tsx') {
                let importText = `import React from 'react';\n`;
                if(componentName.length > 1) {
                    exportText = `\n\nexport ${componentNameRaw};\n`;
                }
                fs.appendFileSync(fullFilePath, importText)
                componentName.map(compname => {
                    fs.appendFileSync(
                        fullFilePath,
                        `\nfunction ${compname}() {\n  return (\n    <div>\n      {/* ${compname} component */}\n    </div>\n  );\n}`
                    );
                })
                fs.appendFileSync(fullFilePath, exportText)
            } else if(fileName.split('.')[1] === 'js') {
                componentName.map(compname => {
                    fs.appendFileSync(
                        fullFilePath,
                        `\nfunction ${compname}() {\n  return "${compname} function created";\n}`
                    );
                })
                fs.appendFileSync(fullFilePath, exportText)
            } else {
                componentName.map(compname => {
                    fs.appendFileSync(
                        fullFilePath,
                        ''
                    );
                }) 
            }
        }  
    } else {
        vscode.window.showWarningMessage(`Write the name of the file to be created, please.`);
    }

}
// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
