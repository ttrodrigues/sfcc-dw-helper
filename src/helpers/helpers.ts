import * as vscode from "vscode";
import * as fs from 'fs';

export function formatJson () {   
    //@ts-ignore
    const rootFolder = vscode.workspace.workspaceFolders[0].uri.path
    const path = `${rootFolder}/dw.json`; 
    //@ts-ignore
    const initialJson = JSON.parse(fs.readFileSync(path));

    const stringifyJson = JSON.stringify(initialJson);
    const formattedJson = stringifyJson.replace('code-version', 'codeversion');
    const readJson = JSON.parse(formattedJson);

    return readJson;
}

export function validateJson (json:any) {
    const Validator = require('jsonschema').Validator;
    let v = new Validator();
        
    const jsonSchema = {
      "type": "object",
      "properties": {
          "hostname": { "type": "string" },
          "username": { "type": "string" },
          "password": { "type": "string" },
          "code-version": { "type": "string" }
      },
      "required": ["hostname", "username", "password", "code-version"]
    }
  
    return v.validate(json, jsonSchema);
}

export function defaultJson () {   
    //@ts-ignore
    const rootFolder:string = vscode.workspace.workspaceFolders[0].uri.fsPath
    const path = `${rootFolder}/dw.json`; 
    //@ts-ignore
    const initialJson:any = JSON.parse(fs.readFileSync(path));

    return initialJson;
}