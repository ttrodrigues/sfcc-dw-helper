import * as vscode from "vscode";
import { getNonce } from "./getNonce";
import { formatJson, defaultJson, updateProperty, jsonPath, formatConfigurationCodeVersionArray, ocapiGetCodeVersions, quickPickSelectItemDelete, inputboxCreateItem, quickPickSelectItem, initialWebView, showStatusBarItem, getProphetInfo, eraseTokenObj } from "./helpers/helpers";
import { Constants } from "./helpers/constants"

export class Sidebar implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;
  
  
  constructor(private readonly _extensionUri: vscode.Uri) {}
  
  public async resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    
    let statusBar:any = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, -10);
        
    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };
    
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    
    let initialView:any = await initialWebView();
    
    webviewView.webview.postMessage({command:"initialView", data:initialView});
    
    if (initialView === Constants.WEBVIEW_DEFAULT) {
      let currentJson:any = await formatJson();
      webviewView.webview.postMessage({command:"jsonValues", data:currentJson});
      showStatusBarItem(statusBar, false);
      statusBar.show();
    }

    // Listener to changes in configuration options
    vscode.workspace.onDidChangeConfiguration(async event => {
      const affectedEnableDevBuildBtn:boolean = event.affectsConfiguration("sfcc-dw-helper.enableDevBuildBtn");
      const affectedEnablePrdBuildBtn:boolean = event.affectsConfiguration("sfcc-dw-helper.enablePrdBuildBtn");
      const affectedCommandDevBuildBtn:boolean = event.affectsConfiguration("sfcc-dw-helper.commandDevBuildBtn");
      const affectedCommandPrdBuildBtn:boolean = event.affectsConfiguration("sfcc-dw-helper.commandPrdBuildBtn");
      const affectedTextDevBuildBtn:boolean = event.affectsConfiguration("sfcc-dw-helper.textDevBuildBtn");
      const affectedTextPrdBuildBtn:boolean = event.affectsConfiguration("sfcc-dw-helper.textPrdBuildBtn");
        
      if (affectedEnableDevBuildBtn || affectedEnablePrdBuildBtn || affectedCommandDevBuildBtn || affectedCommandPrdBuildBtn || affectedTextDevBuildBtn || affectedTextPrdBuildBtn) {
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);   
        let currentJson:any = await formatJson();
        webviewView.webview.postMessage({command:"jsonValues", data:currentJson});
      }
    });

    // For active the Prophet extension on startup 
    vscode.commands.executeCommand(Constants.COMMAND_REFRESH_CARTRIDGES);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "onChangeFile": {
          if (!data.value) {
            return;
          } 

          const { writeFileSync } = require("fs");
          const path = jsonPath(); 

          try {
            writeFileSync(path, JSON.stringify(data.value, null, 2), "utf8");
            vscode.commands.executeCommand(Constants.COMMAND_DISABLE_UPLOAD);
            showStatusBarItem(statusBar, false);
            let currentJson:any = await formatJson();
            webviewView.webview.postMessage({command:"jsonValues", data:currentJson});
          } catch (error: any) {
            vscode.window.showErrorMessage(Constants.UPDATE_FILE_ERROR_MESSAGE, error);            
          }         

          break;
        }

        case "onCleanUpload": {
          if (!data.value) {
            return;
          } 

          const prophetExtension = getProphetInfo();

          if (prophetExtension.isActive) {
            vscode.commands.executeCommand(Constants.COMMAND_CLEAN_UPLOAD);
            showStatusBarItem(statusBar, true);
          }

          break;
        }

        case "onDisableUpload": {
          if (!data.value) {
            return;
          } 
          
          vscode.commands.executeCommand(Constants.COMMAND_DISABLE_UPLOAD);
          showStatusBarItem(statusBar, false);

          break;
        }

        case "onBtnLink": {
          if (!data.value) {
            return;
          } 
          
          const [host, isBusinessManager]:any = data.value;
          const link:string = isBusinessManager ? Constants.URL_PREFIX + host + Constants.URL_BM : Constants.URL_PREFIX + host;
          const parseLink = vscode.Uri.parse(link);

          vscode.commands.executeCommand('vscode.open', parseLink);

          break;
        }

        case "onOpenSettings": {
          if (!data.value) {
            return;
          } 

          vscode.commands.executeCommand('workbench.action.openSettings', Constants.EXTENSION_NAME);

          break;
        }
        
        case "onEnableUpload": {
          if (!data.value) {
            return;
          } 
          
          const prophetExtension = getProphetInfo();

          if (prophetExtension.isActive) {
            vscode.commands.executeCommand(Constants.COMMAND_ENABLE_UPLOAD);
            showStatusBarItem(statusBar, true);
          }

          break;
        }

        case "onBuild": {
          if (!data.value) {
            return;
          } 
          vscode.commands.executeCommand("workbench.action.terminal.killAll");
          vscode.commands.executeCommand(Constants.COMMAND_DISABLE_UPLOAD);
          showStatusBarItem(statusBar, false);

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
                await quickPickSelectItem(formattedItems, Constants.QUICKPICK_TITLE_HOSTNAME, Constants.HOSTNAME, null, false, statusBar, webviewView)
                .then(async () => {
                  eraseTokenObj();
                  let currentJson:any = await formatJson();   
                  webviewView.webview.postMessage({command:"jsonValues", data:currentJson});           
                });   
              } else {
                vscode.window.showInformationMessage(Constants.HOSTNAME_INFO_MESSAGE);
              }
              
              break;
            }

            case Constants.CODEVERSION: {
              items = vscode.workspace.getConfiguration('sfcc-dw-helper').codeversionHistory;
              webviewView.webview.postMessage({command:"loading", data:[true, defaultJson().hostname]}); 
              const formattedItems:any = formatConfigurationCodeVersionArray(items);
              const environmentItems = await ocapiGetCodeVersions();

              if (!environmentItems.error) {

                const json:any = defaultJson();
                const title:string = `${Constants.QUICKPICK_TITLE_CODEVERSON_REMOTE} ${json.hostname}`; 

                await quickPickSelectItem(environmentItems, title, Constants.CODEVERSION,Constants.CODEVERSION_HISTORY_PROPERTY_SHORT, true, statusBar, webviewView)
                .then(async () => { 
                  let currentJson:any = await formatJson(); 
                  webviewView.webview.postMessage({command:"jsonValues", data:currentJson});           
                }); 

              } else {

                if (formattedItems !== null) {

                  const clientId:any = vscode.workspace.getConfiguration('sfcc-dw-helper').get('ocapiClientId');
                  const clientPassword:any = vscode.workspace.getConfiguration('sfcc-dw-helper').get('ocapiClientPassword');

                  if (clientId.length && clientPassword.length) {
                    vscode.window.showInformationMessage(Constants.REMOTE_CODEVERSIONS_ERROR);
                  }

                  await quickPickSelectItem(formattedItems, Constants.QUICKPICK_TITLE_CODEVERSON, Constants.CODEVERSION, null, false, statusBar, webviewView)
                  .then(async () => { 
                    let currentJson:any = await formatJson();   
                    webviewView.webview.postMessage({command:"jsonValues", data:currentJson});         
                  }); 

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
          
          webviewView.webview.postMessage({command:"loading", data:[true, defaultJson().hostname]}); 
          
          const environmentItems = await ocapiGetCodeVersions();

          if (!environmentItems.error) {
            await inputboxCreateItem(webviewView);
          } else {
            vscode.window.showErrorMessage(Constants.CONNECTION_ERROR_REMOTE );
            webviewView.webview.postMessage({command:"loading", data:[false, '']}); 
          }
          break;
        }

        case "onDeleteCodeversion": {
          if (!data.value) {
            return;
          }  
         
          webviewView.webview.postMessage({command:"loading", data:[true, defaultJson().hostname]}); 

          const environmentItems = await ocapiGetCodeVersions();

          if (!environmentItems.error) {
            quickPickSelectItemDelete(environmentItems, webviewView);
          } else {
            vscode.window.showErrorMessage(Constants.CONNECTION_ERROR_REMOTE);
            webviewView.webview.postMessage({command:"loading", data:[false, '']}); 
          }
          
          break;
        }

        case "onCreateFile": {
          const toCreateFile = data.value;                    
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
            if (toCreateFile) {
              vscode.window.showInformationMessage(Constants.CREATE_FILE_SUCCESS_MESSAGE);
            } else {
              vscode.window.showInformationMessage(Constants.FIX_FILE_SUCCESS_MESSAGE);
            }
            webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);    
            webviewView.webview.postMessage({command:"initialView", data:Constants.WEBVIEW_DEFAULT});
            let currentJson:any = await formatJson();
            webviewView.webview.postMessage({command:"jsonValues", data:currentJson});
            showStatusBarItem(statusBar, false);
            statusBar.show();
          } catch (error: any) {
            if (toCreateFile) {
              vscode.window.showErrorMessage(Constants.CREATE_FILE_ERROR_MESSAGE, error);   
            } else {
              vscode.window.showErrorMessage(Constants.FIX_FILE_ERROR_MESSAGE, error);   
            }         
          }         
          break;
        }

        case "onCheckWorkspace": {
          if (!data.value) {
            return;
          }  
          
          const isWorkspaceOpen:boolean = !!vscode.workspace.workspaceFolders;
          webviewView.webview.postMessage({command:"initialView", data:isWorkspaceOpen ? Constants.WEBVIEW_NO_FILE : Constants.WEBVIEW_NO_WORKSPACE});   

          break;
        }

        case "onGetInputData": {
          if (!data.value) {
            return;
          }  
          
          let currentJson:any = await formatJson();
          webviewView.webview.postMessage({command:"jsonValues", data:currentJson});  

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
    
    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

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
    </head>
    <script nonce="${nonce}">
      const tsvscode = acquireVsCodeApi();
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