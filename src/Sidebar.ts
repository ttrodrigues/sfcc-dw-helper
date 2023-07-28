import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import { formatJson, defaultJson, updateProperty, jsonPath, formatConfigurationCodeVersionArray, ocapiGetCodeVersions, ocapiActiveCodeVersion, quickPickSelectItemDelete, inputboxCreateItem } from "./helpers/helpers";
import { Constants } from "./helpers/constants"

export class Sidebar implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  
  
  constructor(private readonly _extensionUri: vscode.Uri) {}
  
  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    const quickPickSelectItem = (items:any, title:string, jsonField:string, propertyChange:any, remoteAccess:boolean) => {
      return new Promise(() => {
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = items.map((item: any) => ({ label: item.displayName, id: item.id }));
        
        quickPick.title = title;
                            
        quickPick.onDidAccept(async () => {
          //@ts-ignore
          const selectionText = quickPick.activeItems[0].id;
          const currentJson:any = defaultJson();
          const { writeFileSync } = require("fs");
          const path = jsonPath(); 

          currentJson[jsonField] = selectionText;        
          writeFileSync(path, JSON.stringify(currentJson, null, 2), "utf8");
          quickPick.hide();
          webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);  
          
          // Only runs in scenario of getting Code Versions on remote environment, will activate the Code Version on environment
          if (remoteAccess) {

              // On scenario of getting Code Versions on remote environment, will be update the array of CodeversionsHistory 
              if (propertyChange) {
                  updateProperty(selectionText, propertyChange); 
              }

              const ocapiCall:any = await ocapiActiveCodeVersion(selectionText);

              if (!ocapiCall.error) {
                  vscode.window.showInformationMessage(Constants.CODEVERSION_SUCCESS_FIRST + selectionText + Constants.ACTIVE_CODEVERSION_SUCCESS_SECOND + currentJson.hostname);
              }
          }
            
        })
        quickPick.show();
      }
      )
    }
    
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
          const path = jsonPath(); 

          try {
            writeFileSync(path, JSON.stringify(data.value, null, 2), "utf8");
            webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
          } catch (error: any) {
            vscode.window.showInformationMessage(Constants.UPDATE_FILE_ERROR_MESSAGE, error);            
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

        case "onChangeProperty": {
          if (!data.value) {
            return;
          }  
          
          const [input, property]:any = data.value;

          updateProperty(input, property);       

          break;
        }

        case "onShowQuickPick": {
          if (!data.value) {
            return;
          } 

          let items:any;
         
          switch (data.value) {
            case Constants.HOSTNAME: {
              items = vscode.workspace.getConfiguration('sfcc-dw-helper').hostnameHistory;
              const formattedItems:any = formatConfigurationCodeVersionArray(items);
              
              if (formattedItems !== null) {
                quickPickSelectItem(formattedItems, Constants.QUICKPICK_TITLE_HOSTNAME, Constants.HOSTNAME, null, false); 
              } else {
                vscode.window.showInformationMessage(Constants.HOSTNAME_INFO_MESSAGE);
              }
              
              break;
            }

            case Constants.CODEVERSION: {
              items = vscode.workspace.getConfiguration('sfcc-dw-helper').codeversionHistory;
              const formattedItems:any = formatConfigurationCodeVersionArray(items);

              const environmentItems = await ocapiGetCodeVersions();

              if (!environmentItems.error) {

                const json:any = defaultJson();
                const title:string = `${Constants.QUICKPICK_TITLE_CODEVERSON_REMOTE} ${json.hostname}`; 

                quickPickSelectItem(environmentItems, title, Constants.CODEVERSION,Constants.CODEVERSION_HISTORY_PROPERTY_SHORT, true);  

              } else {

                if (formattedItems !== null) {

                  const clientId:any = vscode.workspace.getConfiguration('sfcc-dw-helper').get('ocapiClientId');
                  const clientPassword:any = vscode.workspace.getConfiguration('sfcc-dw-helper').get('ocapiClientPassword');

                  if (clientId.length && clientPassword.length) {
                    vscode.window.showInformationMessage(Constants.REMOTE_CODEVERSIONS_ERROR);
                  }

                  quickPickSelectItem(formattedItems, Constants.QUICKPICK_TITLE_CODEVERSON, Constants.CODEVERSION, null, false); 

                } else {

                  vscode.window.showInformationMessage(Constants.CODEVERSION_INFO_MESSAGE);
                  
                }
              }              

              break;
            }            
          }     

          break;          
        }   

        case "onNewCodeversion": {
          if (!data.value) {
            return;
          }  
          
          const environmentItems = await ocapiGetCodeVersions();

          if (!environmentItems.error) {
            await inputboxCreateItem();
          } else {
            vscode.window.showInformationMessage(Constants.INPUTBOX_ERROR_REMOTE);
          }
          break;
        }

        case "onDeleteCodeversion": {
          if (!data.value) {
            return;
          }  
         
          const environmentItems = await ocapiGetCodeVersions();

          if (!environmentItems.error) {
            quickPickSelectItemDelete(environmentItems);
          } else {
            vscode.window.showInformationMessage(Constants.REMOTE_CODEVERSIONS_DELETE_ERROR);
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
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out/compiled", "sidebar.js")
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "out/compiled", "sidebar.css")
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

    // Flag of history property names
    const hostname:string = Constants.HOSTNAME;
    const codeversion:string = Constants.CODEVERSION;

    // Hstory property names
    const hostnameHistoryPropertyShort:string = Constants.HOSTNAME_HISTORY_PROPERTY_SHORT;
    const codeversionHistoryPropertyShort:string = Constants.CODEVERSION_HISTORY_PROPERTY_SHORT;

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
      const hostname = "${hostname}";
      const codeversion = "${codeversion}";
      const hostnameHistoryPropertyShort = "${hostnameHistoryPropertyShort}";
      const codeversionHistoryPropertyShort = "${codeversionHistoryPropertyShort}";
    </script>
    <body>
      <script nonce="${nonce}" src="${scriptUri}">
      </script>
    </body>
    </html>`;

    return htmlContent;
  }
}