// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ConnectionSettingsTreeProvider } from "./treeViews/ConnectionSettingsTreeProvider";
import { CommandsTreeProvider } from "./treeViews/CommandsTreeProvider";
import { EnvironmentTreeProvider } from "./treeViews/EnvironmentTreeProvider";
import { CompilerTreeProvider } from "./treeViews/CompilerTreeProvider";
import { CommandHandler } from "./commands/CommandHandler";
import { Constants } from "./helpers/constants";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {

  // Create status bar item
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, -10);
  statusBar.show();

  // Initialize command handler
  const commandHandler = new CommandHandler(statusBar);

  // Create tree data providers
  const connectionTreeProvider = new ConnectionSettingsTreeProvider();
  const commandsTreeProvider = new CommandsTreeProvider();
  const environmentTreeProvider = new EnvironmentTreeProvider();
  const compilerTreeProvider = new CompilerTreeProvider();

  // Set tree providers in command handler
  commandHandler.setTreeProviders(
    connectionTreeProvider,
    commandsTreeProvider,
    environmentTreeProvider,
    compilerTreeProvider
  );

  // Register tree views
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      'sfcc-dw-helper-connection',
      connectionTreeProvider
    )
  );

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      'sfcc-dw-helper-commands',
      commandsTreeProvider
    )
  );

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      'sfcc-dw-helper-environment',
      environmentTreeProvider
    )
  );

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      'sfcc-dw-helper-compiler',
      compilerTreeProvider
    )
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('sfcc-dw-helper.editField', 
      (field: string, label: string) => commandHandler.editField(field, label))
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('sfcc-dw-helper.executeCommand', 
      (commandId: string) => commandHandler.executeCommand(commandId))
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('sfcc-dw-helper.executeEnvironmentAction', 
      (actionId: string) => commandHandler.executeEnvironmentAction(actionId))
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('sfcc-dw-helper.executeBuild', 
      (command: string) => commandHandler.executeBuild(command))
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('sfcc-dw-helper.openSettings', 
      () => commandHandler.openSettings())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('sfcc-dw-helper.refreshConnection', 
      () => connectionTreeProvider.refresh())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('sfcc-dw-helper.refreshCommands', 
      () => commandsTreeProvider.refresh())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('sfcc-dw-helper.refreshEnvironment', 
      () => environmentTreeProvider.refresh())
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('sfcc-dw-helper.refreshCompiler', 
      () => compilerTreeProvider.refresh())
  );

  // For active the Prophet extension on startup 
  vscode.commands.executeCommand(Constants.COMMAND_REFRESH_CARTRIDGES);

  // Listen to configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(event => {
      const affectedEnableDevBuildBtn = event.affectsConfiguration("sfcc-dw-helper.enableDevBuildBtn");
      const affectedEnablePrdBuildBtn = event.affectsConfiguration("sfcc-dw-helper.enablePrdBuildBtn");
      const affectedCommandDevBuildBtn = event.affectsConfiguration("sfcc-dw-helper.commandDevBuildBtn");
      const affectedCommandPrdBuildBtn = event.affectsConfiguration("sfcc-dw-helper.commandPrdBuildBtn");
      const affectedTextDevBuildBtn = event.affectsConfiguration("sfcc-dw-helper.textDevBuildBtn");
      const affectedTextPrdBuildBtn = event.affectsConfiguration("sfcc-dw-helper.textPrdBuildBtn");
        
      if (affectedEnableDevBuildBtn || affectedEnablePrdBuildBtn || affectedCommandDevBuildBtn || 
          affectedCommandPrdBuildBtn || affectedTextDevBuildBtn || affectedTextPrdBuildBtn) {
        compilerTreeProvider.refresh();
      }
    })
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}