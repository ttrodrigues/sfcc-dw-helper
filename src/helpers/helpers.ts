import * as vscode from "vscode";
import * as fs from 'fs';
import { Constants } from "./constants"


export function formatJson () {   
    //@ts-ignore
    const rootFolder = vscode.workspace.workspaceFolders[0].uri.fsPath
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

export async function quickPick (items:any, title:string) {
    return new Promise((resolve) => {
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = items.map((item: any) => ({ label: item }));

        quickPick.title = title;

        // quickPick.onDidChangeValue(() => {
        //     // INJECT user values into proposed values
        //     if (!items.includes(quickPick.value)) quickPick.items = [quickPick.value, ...items].map(label => ({ label }))
        // })

        quickPick.onDidAccept(() => {
            const selection = quickPick.activeItems[0]
            resolve(selection.label)
            quickPick.hide()
        })
        quickPick.show();
    })
}

export async function updateProperty (inputText:string) {
    const currentProperty:any = vscode.workspace.getConfiguration('sfcc-dw-helper').hostnameHistory;
    let newProperty:any = [];
    let isRepeated:boolean;
    
    if (currentProperty === null) {
        newProperty.push(inputText);
    } else {
        newProperty.push(...currentProperty);
        isRepeated = newProperty.some((e:string) => e === inputText);

        if (!isRepeated) {
            newProperty.push(inputText);
            
            if (currentProperty.length > 9) {
                newProperty.shift();
            }
        }

    }

    await vscode.workspace.getConfiguration().update('sfcc-dw-helper.hostnameHistory', newProperty, vscode.ConfigurationTarget.Global);
}


