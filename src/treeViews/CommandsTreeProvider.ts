import * as vscode from "vscode";
import { getProphetInfo } from "../helpers/helpers";

export class CommandsTreeProvider implements vscode.TreeDataProvider<CommandTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<CommandTreeItem | undefined | null | void> = new vscode.EventEmitter<CommandTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<CommandTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: CommandTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: CommandTreeItem): Promise<CommandTreeItem[]> {
    if (!element) {
      const prophetExtension = getProphetInfo();
      
      if (!prophetExtension.isActive) {
        return [new CommandTreeItem("Prophet extension not installed", "", vscode.TreeItemCollapsibleState.None)];
      }

      // Root level - show all Prophet commands
      return [
        new CommandTreeItem("Clean Project / Upload All", "prophet:cleanUpload", vscode.TreeItemCollapsibleState.None, "command", "cloud-upload"),
        new CommandTreeItem("Enable Upload", "prophet:enableUpload", vscode.TreeItemCollapsibleState.None, "command", "check"),
        new CommandTreeItem("Disable Upload", "prophet:disableUpload", vscode.TreeItemCollapsibleState.None, "command", "x"),
      ];
    }

    return [];
  }
}

export class CommandTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly commandId: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValueType?: string,
    public readonly iconName?: string
  ) {
    super(label, collapsibleState);
    
    this.contextValue = contextValueType || "info";
    
    if (iconName) {
      this.iconPath = new vscode.ThemeIcon(iconName);
    }
    
    if (commandId.startsWith("prophet:")) {
      this.command = {
        command: 'sfcc-dw-helper.executeCommand',
        title: 'Execute Command',
        arguments: [commandId]
      };
    }
  }
}
