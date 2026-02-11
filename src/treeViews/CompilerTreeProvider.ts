import * as vscode from "vscode";

export class CompilerTreeProvider implements vscode.TreeDataProvider<CompilerTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<CompilerTreeItem | undefined | null | void> = new vscode.EventEmitter<CompilerTreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<CompilerTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor() {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: CompilerTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: CompilerTreeItem): Promise<CompilerTreeItem[]> {
    if (!element) {
      const items: CompilerTreeItem[] = [];
      
      // Check if the button for run Development compiler should be visible
      const enableDevBuildBtn: boolean = vscode.workspace.getConfiguration('sfcc-dw-helper').enableDevBuildBtn;
      const commandDevBuildBtn: string = vscode.workspace.getConfiguration('sfcc-dw-helper').commandDevBuildBtn;
      const textDevBuildBtn: string = vscode.workspace.getConfiguration('sfcc-dw-helper').textDevBuildBtn;
      const showDevBuildBtn: boolean = !!(enableDevBuildBtn && commandDevBuildBtn && commandDevBuildBtn.length && textDevBuildBtn);

      // Check if the button for run Production compiler should be visible
      const enablePrdBuildBtn: boolean = vscode.workspace.getConfiguration('sfcc-dw-helper').enablePrdBuildBtn;
      const commandPrdBuildBtn: string = vscode.workspace.getConfiguration('sfcc-dw-helper').commandPrdBuildBtn;
      const textPrdBuildBtn: string = vscode.workspace.getConfiguration('sfcc-dw-helper').textPrdBuildBtn;
      const showPrdBuildBtn: boolean = !!(enablePrdBuildBtn && commandPrdBuildBtn && commandPrdBuildBtn.length && textPrdBuildBtn);

      if (showDevBuildBtn) {
        items.push(new CompilerTreeItem(textDevBuildBtn, commandDevBuildBtn, vscode.TreeItemCollapsibleState.None, "compiler", "tools"));
      }

      if (showPrdBuildBtn) {
        items.push(new CompilerTreeItem(textPrdBuildBtn, commandPrdBuildBtn, vscode.TreeItemCollapsibleState.None, "compiler", "package"));
      }

      if (items.length === 0) {
        return [new CompilerTreeItem("No compilers configured", "", vscode.TreeItemCollapsibleState.None)];
      }

      return items;
    }

    return [];
  }
}

export class CompilerTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly buildCommand: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValueType?: string,
    public readonly iconName?: string
  ) {
    super(label, collapsibleState);
    
    this.contextValue = contextValueType || "info";
    
    if (iconName) {
      this.iconPath = new vscode.ThemeIcon(iconName);
    }
    
    if (buildCommand) {
      this.command = {
        command: 'sfcc-dw-helper.executeBuild',
        title: 'Execute Build',
        arguments: [buildCommand]
      };
    }
  }
}
