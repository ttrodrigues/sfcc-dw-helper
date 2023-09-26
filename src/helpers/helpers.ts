import * as vscode from "vscode";
import * as fs from 'fs';
import axios from 'axios';
import { Constants } from "./constants";
import btoa = require("btoa");
const url = require('url');

/**
 * Format the parameters of the dw.json file
 *
 * @returns JSON with formatted parameters, without special characters 
 */
export function formatJson () {   
    const path = jsonPath(); 
    //@ts-ignore
    const initialJson = JSON.parse(fs.readFileSync(path));

    const stringifyJson = JSON.stringify(initialJson);
    const formattedJson = stringifyJson.replace('code-version', 'codeversion');
    const readJson = JSON.parse(formattedJson);

    return readJson;
}

/**
 * Validate the JSON schema
 *
 * @param   json JSON to be validate
 * @returns Object with resume of the validation
 */
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

/**
 * Default JSON file value
 *
 * @returns JSON with the current value of dw.json
 */
export function defaultJson () {   
    const path = jsonPath(); 
    //@ts-ignore
    const initialJson:any = JSON.parse(fs.readFileSync(path));

    return initialJson;
}

/**
 * Update the property configuration with the input text value
 *
 * @param   inputText Text to be insert on configuration property 
 * @param   property  Property name that will update
 */
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
            
            if (currentProperty.length > 19) {
                newProperty.shift();
            }
        }

    }

    await vscode.workspace.getConfiguration().update(`sfcc-dw-helper.${property}`, newProperty, vscode.ConfigurationTarget.Global);
}

/**
 * Get the full path o the dw.json
 *
 * @returns Full path of the dw.json file
 */
export function jsonPath () {   
    //@ts-ignore
    const rootFolder:string = vscode.workspace.workspaceFolders[0].uri.fsPath
    const path:string = `${rootFolder}/dw.json`; 
   
    return path;
}

/**
 * Get SFCC session token 
 *
 * @returns Object with a flag of error and the server response
 */
export async function getToken () {   
    const clientId:any = vscode.workspace.getConfiguration('sfcc-dw-helper').get('ocapiClientId');
    const dwFile:any = defaultJson();
    const authorizationHeader:any = getAuthorizationHeader();
    
    let result:any = {
        error: true,
        response: {}
    };

    if (authorizationHeader === undefined) {
        return result;
    }
    
    const endpointUrl:string = Constants.URL_PREFIX + dwFile.hostname + Constants.URL_GET_TOKEN;
    const payload:any = { client_id: clientId, grant_type: Constants.URL_GRANT_TYPE };
    const headers:any = { 'Authorization': authorizationHeader, 'Content-Type': Constants.URL_CONTENT_TYPE };
    const params:any = new url.URLSearchParams(payload);
    const finalUrl:string = `${endpointUrl}?${params}`;

    const config = {
        method: 'post',
        url: finalUrl,
        headers: headers
    }
    await axios(config)
        .then(function (response:any) {
            result = {
                error: false,
                response: response
            };
        })
        .catch(function (error:any) {
            result = {
                error: true,
                response: error
            };
        }); 
    
    return result;
}

/**
 * Get the SFCC Authorization header 
 *
 * @returns Authorization header encode64
 */
function getAuthorizationHeader () {   
    const clientPassword:any = vscode.workspace.getConfiguration('sfcc-dw-helper').get('ocapiClientPassword');

    if (!clientPassword) {
        return;
    }

    const dwFile:any = defaultJson();

    const paramToEncrypt:string = `${dwFile.username}:${dwFile.password}:${clientPassword}`; 
    const encode64:string = btoa(paramToEncrypt);
    const header:string = Constants.URL_HEADER_AUTHORIZATION + encode64;

    return header;
}

/**
 * OCAPI call to SFCC environment to get all Code Versions
 *
 * @returns Object with all Code Versions of the environment
 */
export async function ocapiGetCodeVersions () {   
    const clientId:any = vscode.workspace.getConfiguration('sfcc-dw-helper').get('ocapiClientId');
    const dwFile:any = defaultJson();
    const token:any = await getToken();

    let result:any = token;

    //@ts-ignore
    if (token.response.status === 200) {
        //@ts-ignore
        const authorizationHeader:string = `${token.response.data.token_type} ${token.response.data.access_token}`
    
        const endpointUrl:string = Constants.URL_PREFIX + dwFile.hostname + Constants.URL_GET_CODEVERSIONS;
        const headers:any = { 'Authorization': authorizationHeader, 'x-dw-client-id': clientId};
    
        const config = {
            method: 'get',
            url: endpointUrl,
            headers: headers
        }
        await axios(config)
            .then(function (response:any) {
                result = {
                    error: false,
                    response: response
                };
            })
            .catch(function (error:any) {
                result = {
                    error: true,
                    response: error
                };
            });
    }

    let returnValue:any;

    if (!result.error) {
        returnValue = formatRemoteCodeVersionArray(result.response.data.data);
    } else {
        returnValue = result;
    }
    
    return returnValue;
}

/**
 * Format the extension configuration Code Version array
 *
 * @param   items  Direct array from the configuration settings
 * @returns New array with a new format.
 */
export function formatConfigurationCodeVersionArray (items:any) {
    let formattedArray:any  = []   
    items.forEach((codeversion:any) => {
        let obj:any = {};
    
        obj['id'] = codeversion;
        obj['displayName'] = codeversion;
    
        formattedArray.push(obj);    
    });

    return formattedArray;    
}

/**
 * Format the remote Code Version array
 *
 * @param   items  Direct array from the configuration settings
 * @returns New array with a new format.
 */
export function formatRemoteCodeVersionArray (items:any) {
    let formattedArray:any  = []   
    items.forEach((codeversion:any) => {
        let obj:any = {};
    
        obj['id'] = codeversion.id;
        obj['displayName'] = codeversion.active ? `${codeversion.id} ${Constants.CODEVERSIONS_ACTIVE}` : codeversion.id;
    
        formattedArray.push(obj);    
    });

    return formattedArray;    
}

/**
 * OCAPI call to SFCC environment to create or delete an Code Version
 *
 * @param   codeversion Code version to be created/deleted
 * @param   method Method to be used on OCAPI call
 * @returns Object with result of the OCAPI call
 */
export async function ocapiCreateDeleteCodeVersion (codeversion: string, method:string) {   
    const clientId:any = vscode.workspace.getConfiguration('sfcc-dw-helper').get('ocapiClientId');
    const dwFile:any = defaultJson();
    const token:any = await getToken();

    let result:any = token;

    //@ts-ignore
    if (token.response.status === 200) {
        //@ts-ignore
        const authorizationHeader:string = `${token.response.data.token_type} ${token.response.data.access_token}`
    
        const endpointUrl:string = Constants.URL_PREFIX + dwFile.hostname + Constants.URL_PUT_DELETE_CODEVERSIONS + codeversion;
        const headers:any = { 'Authorization': authorizationHeader, 'x-dw-client-id': clientId, 'Content-Type': Constants.URL_CONTENT_TYPE_UTF8 };
    
        const config = {
            method: method,
            url: endpointUrl,
            headers: headers
        }
        await axios(config)
            .then(function (response:any) {
                result = {
                    error: false,
                    response: response
                };
            })
            .catch(function (error:any) {
                result = {
                    error: true,
                    response: error
                };
            });
    }
        
    return result;
}

/**
 * OCAPI call to SFCC environment to active an Code Version
 *
 * @param   codeversion Code version to be actived
 * @returns Object with result of OCAPI call
 */
export async function ocapiActiveCodeVersion (codeversion: string) {   
    const clientId:any = vscode.workspace.getConfiguration('sfcc-dw-helper').get('ocapiClientId');
    const dwFile:any = defaultJson();
    const token:any = await getToken();

    let result:any = token;

    //@ts-ignore
    if (token.response.status === 200) {
        //@ts-ignore
        const authorizationHeader:string = `${token.response.data.token_type} ${token.response.data.access_token}`
    
        const endpointUrl:string = Constants.URL_PREFIX + dwFile.hostname + Constants.URL_PUT_DELETE_CODEVERSIONS + codeversion;
        const headers:any = { 'Authorization': authorizationHeader, 'x-dw-client-id': clientId, 'Content-Type': Constants.URL_CONTENT_TYPE_UTF8 };
    
        const config = {
            method: "patch",
            url: endpointUrl,
            headers: headers,
            data: {
                "active": true
            }
        }
        await axios(config)
            .then(function (response:any) {
                result = {
                    error: false,
                    response: response
                };
            })
            .catch(function (error:any) {
                result = {
                    error: true,
                    response: error
                };
            });
    }
        
    return result;
}

/**
 * Open quickpick to delete a Code Version
 *
 * @param   items List of Code Version to show on quickpick
 */
export async function quickPickSelectItemDelete (items:any) {
    return new Promise(() => {
        const quickPick = vscode.window.createQuickPick();
        quickPick.items = items.map((item: any) => ({ label: item.displayName, id: item.id }));
        
        quickPick.title = Constants.QUICKPICK_TITLE_TO_DELETE;
                            
        quickPick.onDidAccept(async () => {
            //@ts-ignore
            const selectionItem = quickPick.activeItems[0].id;
            const currentJson:any = defaultJson();
            
            quickPick.hide();  
            
            const ocapiCall:any = await ocapiCreateDeleteCodeVersion(selectionItem, Constants.API_DELETE_METHOD);
            
            if (!ocapiCall.error) {
                vscode.window.showInformationMessage(Constants.CODEVERSION_SUCCESS_FIRST + selectionItem + Constants.DELETE_ITEM_SUCCESS_SECOND + currentJson.hostname);
            } else {
                vscode.window.showErrorMessage(Constants.DELETE_ITEM_ERROR + selectionItem);
            }         
            
        })
        quickPick.show();
    })
}


/**
 * Open inputbox to create a new Code Version
 *
 */
export async function inputboxCreateItem () {    
    const inputText:any = await vscode.window.showInputBox({
        placeHolder: Constants.INPUTBOX_PROMPT,
        prompt: Constants.INPUTBOX_TITLE
    });

    if (inputText && inputText.length <= 3) {
        vscode.window.showErrorMessage(Constants.INPUTBOX_ERROR_LENGTH);
        return;
    }
    
    if (inputText !== undefined) {
        const ocapiCall:any = await ocapiCreateDeleteCodeVersion(inputText, Constants.API_PUT_METHOD);
        const currentJson:any = defaultJson();

        if (!ocapiCall.error) {
            vscode.window.showInformationMessage(Constants.CODEVERSION_SUCCESS_FIRST + inputText + Constants.INPUTBOX_SUCCESS_SECOND + currentJson.hostname);
        } else {
            vscode.window.showErrorMessage(Constants.INPUTBOX_ERROR + inputText);
        }    
    }
    
}

/**
 * Open quickpick to select a Code Version or Hostname
 *
 * @param   items List of Code Version or Hostname to show on quickpick
 * @param   title Title of the quickpick
 * @param   jsonField Name of property of the dw.json file
 * @param   propertyChange Property of settings to be updated
 * @param   remoteAccess If is execution to remote environment
 */
export async function quickPickSelectItem (items:any, title:string, jsonField:string, propertyChange:any, remoteAccess:boolean) {
    return new Promise<void>((resolve) => {
      const quickPick = vscode.window.createQuickPick();
      quickPick.items = items.map((item: any) => ({ label: item.displayName, id: item.id }));
      
      quickPick.title = title;
                          
      quickPick.onDidAccept(async () => {
        //@ts-ignore
        const selectionText = quickPick.activeItems[0].id;
        const currentJson:any = defaultJson();
        const { writeFileSync } = require("fs");
        const path = jsonPath(); 

        currentJson[jsonField] = selectionText;        
        writeFileSync(path, JSON.stringify(currentJson, null, 2), "utf8");
        quickPick.hide();
        vscode.commands.executeCommand(Constants.COMMAND_DISABLE_UPLOAD);
                
        // Only runs in scenario of getting Code Versions on remote environment, will activate the Code Version on environment
        if (remoteAccess) {

            // On scenario of getting Code Versions on remote environment, will be update the array of CodeversionsHistory 
            if (propertyChange) {
                updateProperty(selectionText, propertyChange); 
            }

            const ocapiCall:any = await ocapiActiveCodeVersion(selectionText);

            if (!ocapiCall.error) {
                vscode.window.showInformationMessage(Constants.CODEVERSION_SUCCESS_FIRST + selectionText + Constants.ACTIVE_CODEVERSION_SUCCESS_SECOND + currentJson.hostname);
            }            
        }   
        
        resolve();
      })
      
      quickPick.show();
    })
}

/**
 * Get the initial WebView to be rendered
 *
 */
export async function initialWebView () {   
    let file:any = await vscode.workspace.findFiles(Constants.FILENAME, null, 1);

    if (!file.length) {
        return Constants.WEBVIEW_NO_FILE;    
    }

    // To validate the json schema    
    const initialJson:any = defaultJson();
    const jsonValidationResult:any = validateJson(initialJson);

    if (!jsonValidationResult.valid) {
        return Constants.WEBVIEW_SCHEMA_ERROR;
    }

    return Constants.WEBVIEW_DEFAULT;
}