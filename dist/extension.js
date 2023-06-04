/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Sidebar = void 0;
const vscode = __webpack_require__(1);
const getNonce_1 = __webpack_require__(3);
const fs = __webpack_require__(4);
class Sidebar {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView) {
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
                    const { writeFileSync } = __webpack_require__(4);
                    //@ts-ignore
                    const rootFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
                    const path = `${rootFolder}/dw.json`;
                    try {
                        writeFileSync(path, JSON.stringify(data.value, null, 2), "utf8");
                    }
                    catch (error) {
                        vscode.window.showErrorMessage(`Error when updating dw.json file: `, error);
                    }
                    break;
                }
                case 'init-view': {
                    if (!data.value) {
                        return;
                    }
                    //@ts-ignore
                    const rootFolder = vscode.workspace.workspaceFolders[0].uri.path;
                    const path = `${rootFolder}/dw.json`;
                    const pathFormatted = path.substring(1);
                    //@ts-ignore
                    const json = JSON.parse(fs.readFileSync(pathFormatted));
                    console.log(json);
                    console.log(json.hostname);
                    webviewView.webview.postMessage({
                        type: 'json',
                        value: json,
                    });
                    return;
                }
            }
        });
    }
    revive(panel) {
        this._view = panel;
    }
    _getHtmlForWebview(webview) {
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out/compiled", "reset.css"));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out/compiled", "sidebar.js"));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out/compiled", "sidebar.css"));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out/compiled", "vscode.css"));
        // Use a nonce to only allow a specific script to be run.
        const nonce = (0, getNonce_1.getNonce)();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
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
exports.Sidebar = Sidebar;


/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getNonce = void 0;
function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
exports.getNonce = getNonce;


/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 5 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ErrorSidebar = void 0;
const vscode = __webpack_require__(1);
const getNonce_1 = __webpack_require__(3);
class ErrorSidebar {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView) {
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
                    const { writeFileSync } = __webpack_require__(4);
                    //@ts-ignore
                    const rootFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
                    const path = `${rootFolder}/dw.json`;
                    const jsonContent = {
                        "hostname": "",
                        "username": "",
                        "password": "",
                        "code-version": ""
                    };
                    try {
                        writeFileSync(path, JSON.stringify(jsonContent, null, 2), "utf8");
                        vscode.window.showInformationMessage(`Created a ${data.value} on this project folder`);
                        vscode.commands.executeCommand("workbench.action.reloadWindow");
                        //workbench.action.webview.reloadWebviewAction
                    }
                    catch (error) {
                        vscode.window.showErrorMessage(`Error when creating ${data.value} file: `, error);
                    }
                    break;
                }
            }
        });
    }
    revive(panel) {
        this._view = panel;
    }
    _getHtmlForWebview(webview) {
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out/compiled", "reset.css"));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out/compiled", "errorsidebar.js"));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out/compiled", "errorsidebar.css"));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "out/compiled", "vscode.css"));
        // Use a nonce to only allow a specific script to be run.
        const nonce = (0, getNonce_1.getNonce)();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
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
exports.ErrorSidebar = ErrorSidebar;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __webpack_require__(1);
const Sidebar_1 = __webpack_require__(2);
const ErrorSidebar_1 = __webpack_require__(5);
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
async function activate(context) {
    const sidebar = new Sidebar_1.Sidebar(context.extensionUri);
    const errorSidebar = new ErrorSidebar_1.ErrorSidebar(context.extensionUri);
    const filename = "dw.json";
    let file = await vscode.workspace.findFiles(filename, null, 1);
    //let currentPanel: vscode.WebviewPanel | undefined = undefined;
    if (file.length > 0) {
        context.subscriptions.push(vscode.window.registerWebviewViewProvider("sfcc-dw-helper-sidebar", sidebar));
        let path = file[0].fsPath;
        //@ts-ignore
        //currentPanel.webview.postMessage({type:"jsonPath", value:path});
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

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=extension.js.map