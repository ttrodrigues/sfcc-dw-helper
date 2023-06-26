import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import { jsonPath } from "./helpers/helpers";
import { Constants } from "./helpers/constants"

export class ErrorSidebar implements vscode.WebviewViewProvider {
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

        case "onCreateFile": {
          if (!data.value) {
            return;
          }
                    
          const { writeFileSync } = require("fs");

          const path = jsonPath();
          
          const jsonContent = {
            "hostname": "",
            "username": "",
            "password": "",
            "code-version": ""
          };

          try {
            writeFileSync(path, JSON.stringify(jsonContent, null, 2), "utf8");
            vscode.window.showInformationMessage(Constants.CREATE_FILE_SUCCESS_MESSAGE);
            vscode.commands.executeCommand("workbench.action.restartExtensionHost");
          } catch (error: any) {
            vscode.window.showErrorMessage(Constants.CREATE_FILE_ERROR_MESSAGE, error);            
          }         
          break;
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
      vscode.Uri.joinPath(this._extensionUri, "out/compiled", "errorsidebar.js")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out/compiled", "errorsidebar.css")
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out/compiled", "vscode.css")
    );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    //@ts-ignore
    const isWorkspaceOpen:boolean = !!vscode.workspace.workspaceFolders;

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
        const isWorkspaceOpen = ${isWorkspaceOpen};
      </script>
      <body>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}