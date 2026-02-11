import * as vscode from "vscode";
import { formatJson, defaultJson, updateProperty, jsonPath, ocapiGetCodeVersions, ocapiActiveCodeVersion, ocapiCreateDeleteCodeVersion, getProphetInfo } from "../helpers/helpers";
import { Constants } from "../helpers/constants";
import * as fs from 'fs';

export class CommandHandler {
  private statusBar: vscode.StatusBarItem;
  private connectionTreeProvider: any;
  private commandsTreeProvider: any;
  private environmentTreeProvider: any;
  private compilerTreeProvider: any;

  constructor(statusBar: vscode.StatusBarItem) {
    this.statusBar = statusBar;
  }

  setTreeProviders(connection: any, commands: any, environment: any, compiler: any) {
    this.connectionTreeProvider = connection;
    this.commandsTreeProvider = commands;
    this.environmentTreeProvider = environment;
    this.compilerTreeProvider = compiler;
  }

  async editField(field: string, label: string) {
    const json = await formatJson();
    if (!json) {
      vscode.window.showErrorMessage("No dw.json file found");
      return;
    }

    let currentValue = "";
    let propertyShort = "";
    
    switch (field) {
      case "hostname":
        currentValue = json.hostname || "";
        propertyShort = Constants.HOSTNAME_HISTORY_PROPERTY_SHORT;
        break;
      case "codeversion":
        currentValue = json.codeversion || "";
        propertyShort = Constants.CODEVERSION_HISTORY_PROPERTY_SHORT;
        break;
      case "username":
        currentValue = json.username || "";
        break;
      case "password":
        currentValue = json.password || "";
        break;
    }

    // Check if we should show history quick pick
    if (field === "hostname") {
      const items = vscode.workspace.getConfiguration('sfcc-dw-helper').hostnameHistory;
      if (items && items.length > 0) {
        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: Constants.QUICKPICK_TITLE_HOSTNAME
        });
        if (selected) {
          await this.updateJsonField(field, selected, propertyShort);
          return;
        }
      }
    }

    if (field === "codeversion") {
      // Try to get code versions from OCAPI first
      const environmentItems = await ocapiGetCodeVersions();
      if (!environmentItems.error) {
        const items = environmentItems.map((item: any) => ({
          label: item.displayName,
          description: item.active,
          detail: item.modification
        }));
        
        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: `${Constants.QUICKPICK_TITLE_CODEVERSON_REMOTE} ${json.hostname}`
        });
        
        if (selected) {
          const cvName = (selected as any).label || selected;
          await this.updateJsonField(field, cvName, propertyShort);
          // Also activate the code version
          await ocapiActiveCodeVersion(cvName);
          return;
        }
      } else {
        // Fallback to history
        const items = vscode.workspace.getConfiguration('sfcc-dw-helper').codeversionHistory;
        if (items && items.length > 0) {
          const selected = await vscode.window.showQuickPick(items, {
            placeHolder: Constants.QUICKPICK_TITLE_CODEVERSON
          });
          if (selected) {
            await this.updateJsonField(field, selected, propertyShort);
            return;
          }
        }
      }
    }

    // For other fields or if no history, show input box
    const value = await vscode.window.showInputBox({
      prompt: `Enter ${label}`,
      value: currentValue,
      password: field === "password"
    });

    if (value !== undefined) {
      await this.updateJsonField(field, value, propertyShort);
    }
  }

  private async updateJsonField(field: string, value: string, propertyShort?: string) {
    const path = jsonPath();
    const json = defaultJson();

    // Update the JSON field
    if (field === "codeversion") {
      json["code-version"] = value;
    } else {
      json[field] = value;
    }

    // Write back to file
    fs.writeFileSync(path, JSON.stringify(json, null, 2), "utf8");

    // Update property history if needed
    if (propertyShort) {
      await updateProperty(value, propertyShort);
    }

    // Disable upload when changing connection settings
    vscode.commands.executeCommand(Constants.COMMAND_DISABLE_UPLOAD);
    this.updateStatusBar(false);

    // Refresh tree views
    this.refreshAllTreeViews();

    vscode.window.showInformationMessage(`${field} updated successfully`);
  }

  async executeCommand(commandId: string) {
    const prophetExtension = getProphetInfo();
    
    if (!prophetExtension.isActive) {
      vscode.window.showWarningMessage("Prophet extension is not installed or not active");
      return;
    }

    switch (commandId) {
      case "prophet:cleanUpload":
        vscode.commands.executeCommand(Constants.COMMAND_CLEAN_UPLOAD);
        this.updateStatusBar(true);
        break;
      case "prophet:enableUpload":
        vscode.commands.executeCommand(Constants.COMMAND_ENABLE_UPLOAD);
        this.updateStatusBar(true);
        break;
      case "prophet:disableUpload":
        vscode.commands.executeCommand(Constants.COMMAND_DISABLE_UPLOAD);
        this.updateStatusBar(false);
        break;
    }
  }

  async executeEnvironmentAction(actionId: string) {
    const json = await defaultJson();
    const hostname = json?.hostname || "";

    switch (actionId) {
      case "env:openBM":
        if (!hostname) {
          vscode.window.showErrorMessage("No hostname configured");
          return;
        }
        const bmLink = Constants.URL_PREFIX + hostname + Constants.URL_BM;
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(bmLink));
        break;
        
      case "env:openSF":
        if (!hostname) {
          vscode.window.showErrorMessage("No hostname configured");
          return;
        }
        const sfLink = Constants.URL_PREFIX + hostname;
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(sfLink));
        break;
        
      case "env:newCodeVersion":
        await this.createCodeVersion();
        break;
        
      case "env:deleteCodeVersion":
        await this.deleteCodeVersion();
        break;
    }
  }

  private async createCodeVersion() {
    const environmentItems = await ocapiGetCodeVersions();
    
    if (environmentItems.error) {
      vscode.window.showErrorMessage(Constants.CONNECTION_ERROR_REMOTE);
      return;
    }

    const cvName = await vscode.window.showInputBox({
      prompt: Constants.INPUTBOX_PROMPT,
      placeHolder: Constants.INPUTBOX_TITLE,
      validateInput: (value) => {
        if (value.length < 3) {
          return Constants.INPUTBOX_ERROR_LENGTH;
        }
        return null;
      }
    });

    if (!cvName) {
      return;
    }

    const result = await ocapiCreateDeleteCodeVersion(cvName, Constants.API_PUT_METHOD);
    
    if (!result.error) {
      const json = await defaultJson();
      vscode.window.showInformationMessage(`${Constants.CODEVERSION_SUCCESS_FIRST}${cvName}${Constants.INPUTBOX_SUCCESS_SECOND}${json.hostname}`);
      this.refreshAllTreeViews();
    } else {
      vscode.window.showErrorMessage(`${Constants.INPUTBOX_ERROR}${cvName}`);
    }
  }

  private async deleteCodeVersion() {
    const environmentItems = await ocapiGetCodeVersions();
    
    if (environmentItems.error) {
      vscode.window.showErrorMessage(Constants.CONNECTION_ERROR_REMOTE);
      return;
    }

    const items = environmentItems.map((item: any) => ({
      label: item.displayName,
      description: item.active,
      detail: item.modification
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: Constants.QUICKPICK_TITLE_TO_DELETE
    });

    if (!selected) {
      return;
    }

    const cvName = (selected as any).label || selected;

    const confirm = await vscode.window.showWarningMessage(
      `Are you sure you want to delete code version "${cvName}"?`,
      { modal: true },
      "Delete"
    );

    if (confirm !== "Delete") {
      return;
    }

    const result = await ocapiCreateDeleteCodeVersion(cvName, Constants.API_DELETE_METHOD);
    
    if (!result.error) {
      const json = await defaultJson();
      vscode.window.showInformationMessage(`${Constants.CODEVERSION_SUCCESS_FIRST}${cvName}${Constants.DELETE_ITEM_SUCCESS_SECOND}${json.hostname}`);
      this.refreshAllTreeViews();
    } else {
      vscode.window.showErrorMessage(`${Constants.DELETE_ITEM_ERROR}${cvName}`);
    }
  }

  async executeBuild(command: string) {
    vscode.commands.executeCommand("workbench.action.terminal.killAll");
    vscode.commands.executeCommand(Constants.COMMAND_DISABLE_UPLOAD);
    this.updateStatusBar(false);

    const terminal = vscode.window.createTerminal(Constants.TERMINAL_NAME);
    terminal.sendText(command);
    terminal.show();
  }

  private updateStatusBar(isConnected: boolean) {
    const json = defaultJson();
    const hostname = json?.hostname || "";
    const codeversion = json?.["code-version"] || "";

    if (isConnected) {
      this.statusBar.text = `$(${Constants.STATUS_BAR_CONNECT_ICON}) ${Constants.STATUS_BAR_CONNECT_MSG} ${hostname}`;
      this.statusBar.tooltip = `Connected to ${hostname} (${codeversion})`;
    } else {
      this.statusBar.text = `$(${Constants.STATUS_BAR_DISCONNECT_ICON}) ${Constants.STATUS_BAR_DISCONNECT_MSG} ${hostname}`;
      this.statusBar.tooltip = `Disconnected from ${hostname}`;
    }

    this.statusBar.command = "sfcc-dw-helper-connection.focus";
  }

  private refreshAllTreeViews() {
    if (this.connectionTreeProvider) {
      this.connectionTreeProvider.refresh();
    }
    if (this.commandsTreeProvider) {
      this.commandsTreeProvider.refresh();
    }
    if (this.environmentTreeProvider) {
      this.environmentTreeProvider.refresh();
    }
    if (this.compilerTreeProvider) {
      this.compilerTreeProvider.refresh();
    }
  }

  async openSettings() {
    vscode.commands.executeCommand('workbench.action.openSettings', Constants.EXTENSION_NAME);
  }
}
