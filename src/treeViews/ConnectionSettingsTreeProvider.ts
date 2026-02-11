import * as vscode from "vscode";
import { formatJson, updateProperty, jsonPath } from "../helpers/helpers";
import { Constants } from "../helpers/constants";

export class ConnectionSettingsTreeProvider implements vscode.TreeDataProvider<ConnectionTreeItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ConnectionTreeItem | undefined | null | void> = new vscode.EventEmitter<
        ConnectionTreeItem | undefined | null | void
    >();
    readonly onDidChangeTreeData: vscode.Event<ConnectionTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor() {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ConnectionTreeItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: ConnectionTreeItem): Promise<ConnectionTreeItem[]> {
        if (!element) {
            // Root level - show all connection settings
            const json = formatJson();

            if (!json) {
                return [new ConnectionTreeItem("No dw.json file found", "", vscode.TreeItemCollapsibleState.None)];
            }

            return [
                new ConnectionTreeItem("Hostname", json.hostname || "", vscode.TreeItemCollapsibleState.None, "hostname"),
                new ConnectionTreeItem("Code Version", json.codeversion || "", vscode.TreeItemCollapsibleState.None, "codeversion"),
                new ConnectionTreeItem("Username", json.username || "", vscode.TreeItemCollapsibleState.None, "username"),
                new ConnectionTreeItem("Password", json.password || "", vscode.TreeItemCollapsibleState.None, "password"),
            ];
        }

        return [];
    }
}

export class ConnectionTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly value: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly field?: string,
    ) {
        super(label, collapsibleState);

        this.description = value;
        this.contextValue = field || "info";

        if (field) {
            this.command = {
                command: "sfcc-dw-helper.editField",
                title: "Edit Field",
                arguments: [field, label],
            };
        }
    }
}
