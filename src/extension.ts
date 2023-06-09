// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Sidebar } from "./Sidebar";
import { ErrorSidebar } from "./ErrorSidebar";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

  const sidebar = new Sidebar(context.extensionUri);
  const errorSidebar = new ErrorSidebar(context.extensionUri);
  const filename:string = "dw.json"
  let file:any = await vscode.workspace.findFiles(filename, null, 1);
  //let currentPanel: vscode.WebviewPanel | undefined = undefined;

  if (file.length > 0) {
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        "sfcc-dw-helper-sidebar",
        sidebar
      )
    );
    
    //let path:string = file[0].fsPath;
    
    //@ts-ignore
    //currentPanel.webview.postMessage({type:"jsonPath", value:path});
  } else {
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        "sfcc-dw-helper-sidebar",
        errorSidebar
      )
    );
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

// This method is called when your extension is deactivated
export function deactivate() {}
