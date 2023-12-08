export namespace Constants {
    export const FILENAME = 'dw.json';
    export const WEBVIEW_NO_FILE = 'noFile';
    export const WEBVIEW_SCHEMA_ERROR = 'schemaError';
    export const WEBVIEW_DEFAULT = 'default';
    export const PROPHET_ID_NAME = 'SqrTT.prophet';
    export const COMMAND_CLEAN_UPLOAD = 'extension.prophet.command.clean.upload';
    export const COMMAND_DISABLE_UPLOAD = 'extension.prophet.command.disable.upload';
    export const COMMAND_REFRESH_CARTRIDGES = 'extension.prophet.command.refresh.cartridges';
    export const COMMAND_ENABLE_UPLOAD = 'extension.prophet.command.enable.upload';
    export const TERMINAL_NAME = 'Build Prophet';
    export const QUICKPICK_TITLE_HOSTNAME = 'Select the Hostname';
    export const QUICKPICK_TITLE_TO_DELETE = 'Select the Code Version to delete';
    export const QUICKPICK_TITLE_CODEVERSON = 'Select the Code Version';
    export const QUICKPICK_TITLE_CODEVERSON_REMOTE = 'Select the Code Version from';
    export const HOSTNAME_HISTORY_PROPERTY = 'sfcc-dw-helper.hostnameHistory';
    export const CODEVERSION_HISTORY_PROPERTY = 'sfcc-dw-helper.codeversionHistory';
    export const HOSTNAME = 'hostname';
    export const CODEVERSION = 'code-version';
    export const HOSTNAME_HISTORY_PROPERTY_SHORT = 'hostnameHistory';
    export const CODEVERSION_HISTORY_PROPERTY_SHORT = 'codeversionHistory';
    export const HOSTNAME_INFO_MESSAGE = 'No Hostname history present on settings';
    export const CODEVERSION_INFO_MESSAGE = 'No Code Version history present on settings';
    export const UPDATE_FILE_ERROR_MESSAGE = 'Error when updating dw.json file: ';
    export const CREATE_FILE_ERROR_MESSAGE = 'Error when creating dw.json file: ';
    export const CREATE_FILE_SUCCESS_MESSAGE = 'Created a dw.json file on this project folder';
    export const FIX_FILE_ERROR_MESSAGE = 'Error on fixing the dw.json file: ';
    export const FIX_FILE_SUCCESS_MESSAGE = 'The dw.json file was been fixed';
    export const URL_GET_TOKEN = '/dw/oauth2/access_token';
    export const URL_PREFIX = 'https://';
    export const URL_HEADER_AUTHORIZATION = 'Basic ';
    export const URL_GRANT_TYPE = 'urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken';
    export const URL_CONTENT_TYPE = 'application/x-www-form-urlencoded';
    export const URL_CONTENT_TYPE_UTF8 = 'application/json;charset=utf-8';
    export const URL_GET_CODEVERSIONS = '/s/-/dw/data/v19_1/code_versions';
    export const URL_PUT_DELETE_CODEVERSIONS = '/s/-/dw/data/v19_1/code_versions/';
    export const CLIENT_PASSWORD_ERROR = 'Please confirm your OCAPI Client Password on extension Settings';
    export const REMOTE_CODEVERSIONS_ERROR = 'Error to get the environment Code Versions. It will use the extension settings option.';
    export const CODEVERSIONS_ACTIVE = '(Active)';
    export const API_PUT_METHOD = 'PUT';
    export const API_DELETE_METHOD = 'DELETE';
    export const CODEVERSION_SUCCESS_FIRST = 'Code version ';
    export const ACTIVE_CODEVERSION_SUCCESS_SECOND = ' is activated on ';
    export const DELETE_ITEM_SUCCESS_SECOND = ' was been removed from ';
    export const DELETE_ITEM_ERROR = 'Error to remove the Code Version ';
    export const INPUTBOX_TITLE = 'Insert the name from the new Code Version';
    export const INPUTBOX_PROMPT = 'Code Version';
    export const INPUTBOX_ERROR_LENGTH = 'The Code Version name should have more that 3 characters';
    export const INPUTBOX_SUCCESS_SECOND = ' has been created on ';
    export const INPUTBOX_ERROR = 'Error to create the Code Version ';
    export const CONNECTION_ERROR_REMOTE = 'Error when connecting to environment';
    export const STATUS_BAR_CONNECT_MSG = 'Connected to';
    export const STATUS_BAR_DISCONNECT_MSG = 'Disconnected from';
    export const STATUS_BAR_CONNECT_ICON = 'cloud';
    export const STATUS_BAR_DISCONNECT_ICON = 'debug-disconnect';
    export const STATUS_BAR_HOSTNAME_ERROR = 'No Hostname defined';
    export const STATUS_BAR_CODEVERSION_ERROR = 'No Code Version defined';
    export const COMMAND_FOCUS_WEBVIEW = 'sfcc-dw-helper-sidebar.focus';
}