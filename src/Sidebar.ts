import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import { formatJson } from "./helpers/helpers";
import { Constants } from "./helpers/constants"

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

    // Listener to changes in configuration options
    vscode.workspace.onDidChangeConfiguration(event => {
      const affectedEnableDevBuildBtn:boolean = event.affectsConfiguration("sfcc-dw-helper.enableDevBuildBtn");
      const affectedEnablePrdBuildBtn:boolean = event.affectsConfiguration("sfcc-dw-helper.enablePrdBuildBtn");
      const affectedCommandDevBuildBtn:boolean = event.affectsConfiguration("sfcc-dw-helper.commandDevBuildBtn");
      const affectedCommandPrdBuildBtn:boolean = event.affectsConfiguration("sfcc-dw-helper.commandPrdBuildBtn");
      const affectedTextDevBuildBtn:boolean = event.affectsConfiguration("sfcc-dw-helper.textDevBuildBtn");
      const affectedTextPrdBuildBtn:boolean = event.affectsConfiguration("sfcc-dw-helper.textPrdBuildBtn");
        
      if (affectedEnableDevBuildBtn || affectedEnablePrdBuildBtn || affectedCommandDevBuildBtn || affectedCommandPrdBuildBtn || affectedTextDevBuildBtn || affectedTextPrdBuildBtn) {
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);   
      }
    })

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
            webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
          } catch (error: any) {
            vscode.window.showErrorMessage(`Error when updating dw.json file: `, error);            
          }         

          break;
        }

        case "onCleanUpload": {
          if (!data.value) {
            return;
          } 

          vscode.commands.executeCommand(Constants.COMMAND_CLEAN_UPLOAD);

          break;
        }

        case "onDisableUpload": {
          if (!data.value) {
            return;
          } 
          
          vscode.commands.executeCommand(Constants.COMMAND_DISABLE_UPLOAD);

          break;
        }

        case "onEnableUpload": {
          if (!data.value) {
            return;
          } 
          
          vscode.commands.executeCommand(Constants.COMMAND_ENABLE_UPLOAD);

          break;
        }

        case "onBuild": {
          if (!data.value) {
            return;
          } 

          const terminal = vscode.window.createTerminal(Constants.TERMINAL_NAME);

          terminal.sendText(data.value);
          terminal.show();

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

    // Get the value of each json field of the file 
    const readJson:any = formatJson();
    const initUsername:string = readJson.username;
    const initPassword:string = readJson.password;
    const initHostname:string = readJson.hostname;
    const initCodeversion:string = readJson.codeversion;

    // Check if Prophet extension is installed
    const allExtensions: readonly any[] = vscode.extensions.all;
    const isProphetInstall = allExtensions.some(e => e.id === Constants.PROPHET_ID_NAME);

    // Check if the button for run Development compiler should be visible or not
    const enableDevBuildBtn:boolean = vscode.workspace.getConfiguration('sfcc-dw-helper').enableDevBuildBtn;
    const commandDevBuildBtn:string = vscode.workspace.getConfiguration('sfcc-dw-helper').commandDevBuildBtn;
    const textDevBuildBtn:string = vscode.workspace.getConfiguration('sfcc-dw-helper').textDevBuildBtn;
    const showDevBuildBtn:boolean = !!(enableDevBuildBtn && commandDevBuildBtn.length && textDevBuildBtn);

    // Check if the button for run Production compiler should be visible or not
    const enablePrdBuildBtn:boolean = vscode.workspace.getConfiguration('sfcc-dw-helper').enablePrdBuildBtn;
    const commandPrdBuildBtn:string = vscode.workspace.getConfiguration('sfcc-dw-helper').commandPrdBuildBtn;
    const textPrdBuildBtn:string = vscode.workspace.getConfiguration('sfcc-dw-helper').textPrdBuildBtn;
    const showPrdBuildBtn:boolean = !!(enablePrdBuildBtn && commandPrdBuildBtn.length && textPrdBuildBtn);

    const htmlContent:string = `<!DOCTYPE html>
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
      const initUsername ="${initUsername}";
      const initPassword ="${initPassword}";
      const initHostname ="${initHostname}";
      const initCodeversion ="${initCodeversion}";
      const isProphetInstall = ${isProphetInstall};
      const showDevBuildBtn = ${showDevBuildBtn};
      const commandDevBuildBtn = "${commandDevBuildBtn}";
      const showPrdBuildBtn = ${showPrdBuildBtn};
      const commandPrdBuildBtn = "${commandPrdBuildBtn}";
      const textDevBuildBtn = "${textDevBuildBtn}";
      const textPrdBuildBtn = "${textPrdBuildBtn}";
    </script>
    <body>
      <script nonce="${nonce}" src="${scriptUri}">
      </script>
    </body>
    </html>`;

    return htmlContent;
  }
}