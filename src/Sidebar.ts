import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import * as fs from 'fs';


export class Sidebar implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  
  constructor(private readonly _extensionUri: vscode.Uri) {}
  
  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;


    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onInfo": {
          if (!data.value) {
            return;
          }
          vscode.window.showInformationMessage(data.value);
          break;
        }
        case "onError": {
          if (!data.value) {
            return;
          }
          vscode.window.showErrorMessage(data.value);
          break;
        }

        case "onChangeFile": {
          if (!data.value) {
            return;
          } 

          const { writeFileSync } = require("fs");

          //@ts-ignore
          const rootFolder = vscode.workspace.workspaceFolders[0].uri.fsPath
          const path = `${rootFolder}/dw.json`; 

          try {
            writeFileSync(path, JSON.stringify(data.value, null, 2), "utf8");
          } catch (error: any) {
            vscode.window.showErrorMessage(`Error when updating dw.json file: `, error);            
          }         

          break;
        }
        case 'init-view': {
          if (!data.value) {
            return;
          } 
          

          //@ts-ignore
          const rootFolder = vscode.workspace.workspaceFolders[0].uri.path
          const path = `${rootFolder}/dw.json`; 

          const pathFormatted = path.substring(1)

          //@ts-ignore
          const json = JSON.parse(fs.readFileSync(pathFormatted));
         
          console.log(json)
          console.log(json.hostname)

          
          webviewView.webview.postMessage({
            type: 'json',
            value: json,
          });

          return;
      }
      }
    });
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out/compiled", "reset.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out/compiled", "sidebar.js")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out/compiled", "sidebar.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out/compiled", "vscode.css")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${
      webview.cspSource
    }; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
			</head>
      <script nonce="${nonce}">
        const tsvscode = acquireVsCodeApi();
      </script>
      <body>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}