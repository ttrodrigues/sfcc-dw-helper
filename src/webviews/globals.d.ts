import * as vscode from 'vscode';
import type WebViewApi from '@types/vscode-webview';

global {
    declare const tsvscode: WebViewApi<unknown>;
  }