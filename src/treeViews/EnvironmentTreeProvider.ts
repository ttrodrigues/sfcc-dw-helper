import * as vscode from "vscode";
import { defaultJson, ocapiGetCodeVersions, quickPickSelectItemDelete, inputboxCreateItem } from "../helpers/helpers";

export class EnvironmentTreeProvider implements vscode.TreeDataProvider<EnvironmentTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<EnvironmentTreeItem | undefined | null | void> = new vscode.EventEmitter<
        EnvironmentTreeItem | undefined | null | void
    >();
    readonly onDidChangeTreeData: vscode.Event<EnvironmentTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: EnvironmentTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: EnvironmentTreeItem): Promise<EnvironmentTreeItem[]> {
        if (!element) {
            const json = defaultJson();
            const hostname = json?.hostname || "";

            // Root level - show environment actions
            return [
                new EnvironmentTreeItem("Open Business Manager", "env:openBM", vscode.TreeItemCollapsibleState.None, "action", "browser"),
                new EnvironmentTreeItem("New Code Version", "env:newCodeVersion", vscode.TreeItemCollapsibleState.None, "action", "add"),
                new EnvironmentTreeItem(
                    "Delete Code Version",
                    "env:deleteCodeVersion",
                    vscode.TreeItemCollapsibleState.None,
                    "action",
                    "trash",
                ),
            ];
        }

        return [];
    }
}

export class EnvironmentTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly actionId: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValueType?: string,
        public readonly iconName?: string,
    ) {
        super(label, collapsibleState);

        this.contextValue = contextValueType || "info";

        if (iconName) {
            this.iconPath = new vscode.ThemeIcon(iconName);
        }

        if (actionId.startsWith("env:")) {
            this.command = {
                command: "sfcc-dw-helper.executeEnvironmentAction",
                title: "Execute Action",
                arguments: [actionId],
            };
        }
    }
}
