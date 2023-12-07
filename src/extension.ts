// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Sidebar } from "./Sidebar";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

  const sidebar = new Sidebar(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "sfcc-dw-helper-sidebar",
      sidebar,
      { webviewOptions: { retainContextWhenHidden: true } }
    ),
    vscode.commands.registerCommand('sfcc-dw-helper-sidebar.open', () => {
      vscode.commands.executeCommand('sfcc-dw-helper-sidebar.focus');
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
//sfcc-dw-helper-sidebar.start