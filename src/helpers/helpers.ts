import * as vscode from "vscode";
import * as fs from 'fs';

export function formatJson () {   
    const path = jsonPath(); 
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
    const path = jsonPath(); 
    //@ts-ignore
    const initialJson:any = JSON.parse(fs.readFileSync(path));

    return initialJson;
}

export async function updateProperty (inputText:string, property:string) {
    const currentProperty:any = vscode.workspace.getConfiguration('sfcc-dw-helper').get(property);
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

    await vscode.workspace.getConfiguration().update(`sfcc-dw-helper.${property}`, newProperty, vscode.ConfigurationTarget.Global);
}

export function jsonPath () {   
    //@ts-ignore
    const rootFolder:string = vscode.workspace.workspaceFolders[0].uri.fsPath
    const path:string = `${rootFolder}/dw.json`; 
   
    return path;
}

