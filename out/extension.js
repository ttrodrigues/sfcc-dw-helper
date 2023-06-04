"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const Sidebar_1 = require("./Sidebar");
const ErrorSidebar_1 = require("./ErrorSidebar");
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
async function activate(context) {
    const sidebar = new Sidebar_1.Sidebar(context.extensionUri);
    const errorSidebar = new ErrorSidebar_1.ErrorSidebar(context.extensionUri);
    const filename = "dw.json";
    let file = await vscode.workspace.findFiles(filename, null, 1);
    if (file.length > 0) {
        context.subscriptions.push(vscode.window.registerWebviewViewProvider("sfcc-dw-helper-sidebar", sidebar));
    }
    else {
        context.subscriptions.push(vscode.window.registerWebviewViewProvider("sfcc-dw-helper-sidebar", errorSidebar));
    }
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    // let disposable = vscode.commands.registerCommand('sfcc-dw-helper.helloWorld', () => {
    // 	// The code you place here will be executed every time your command is executed
    // 	// Display a message box to the user
    // 	vscode.window.showInformationMessage('Hello World from SFCC DW Helper!');
    // });
    // context.subscriptions.push(disposable);
}
exports.activate = activate;
// This method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map