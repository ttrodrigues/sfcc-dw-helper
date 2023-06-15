// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Sidebar } from "./Sidebar";
import { ErrorSidebar } from "./ErrorSidebar";
import { SchemaErrorSidebar } from "./SchemaErrorSidebar"
import { validateJson, defaultJson } from "./helpers/helpers";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

  const sidebar = new Sidebar(context.extensionUri);
  const errorSidebar = new ErrorSidebar(context.extensionUri);
  const schemaErrorSidebar = new SchemaErrorSidebar(context.extensionUri);
  const filename:string = "dw.json"
  let file:any = await vscode.workspace.findFiles(filename, null, 1);

  if (file.length > 0) {
    // To validate the json schema    
    const initialJson:any = defaultJson();
    const jsonValidationResult:any = validateJson(initialJson);

    if (jsonValidationResult.valid) {
      context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
          "sfcc-dw-helper-sidebar",
          sidebar
        )
      );
    } else {
      context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
          "sfcc-dw-helper-sidebar",
          schemaErrorSidebar
        )
      );
    } 
  } else {
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        "sfcc-dw-helper-sidebar",
        errorSidebar
      )
    );
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
