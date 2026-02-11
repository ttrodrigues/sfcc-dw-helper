# SFCC-DW-Helper

Small extension to help the **SFCC (SalesForce Commerce Cloud)** developers, to edit the **dw.json** file, run commands of **Prophet** and control the environment **Code Versions**.

&nbsp;

## Why this Extension?

Simplify the life to **SFCC developers**, with an extension that provides direct edition of **dw.json** and the possibility of run **Prophet** commands on the same sidebar.

The extension validates the mandatory fields that the **dw.json** require to connect with an **SFCC** environment, that are necessary for **Prophet** uploads the code and to start a debug.

| Field        |              Required               |            Is Validated?            |
| ------------ | :---------------------------------: | :---------------------------------: |
| hostname     | ![](/media/svg_checkmark_green.png) | ![](/media/svg_checkmark_green.png) |
| code-version | ![](/media/svg_checkmark_green.png) | ![](/media/svg_checkmark_green.png) |
| username     | ![](/media/svg_checkmark_green.png) | ![](/media/svg_checkmark_green.png) |
| password     | ![](/media/svg_checkmark_green.png) | ![](/media/svg_checkmark_green.png) |

The main commands **Clean Project/Upload All**, **Enable Upload** and **Disable Upload**, are present on the sidebar, for quick execution of them.

For simplify the work of the developers, it's possible to enable until two custom buttons, configured on settings on section **SFCC DW Helper**. These buttons will only run terminal commands.

Interact with environment present on **dw.json**, to get, create, and delete **Code Versions**.

&nbsp;

## Features

### Native VSCode Tree View Interface (NEW in v0.0.39)

The extension now uses VSCode's native tree view components, similar to the Source Control Management (SCM) interface. This provides a cleaner, more integrated experience with better organization:

- **Connection Settings**: Click to edit hostname, code version, username, and password
- **Prophet Commands**: Execute upload and connection commands with a single click
- **Environment**: Manage code versions and open Business Manager/StoreFront
- **Compiler**: Run custom build commands (configurable in settings)

### Edit the dw.json file

Edition of **dw.json** directly from the sidebar tree view with validation

&nbsp;

### New Status bar information for the connection status

Now we can check directly on **Status bar** the status of our connection to environment. When clicked, the **SFCC DW Helper** sidebar we be focused.

![](/media/statusbar.png)

![](/media/statusbar_clicked.gif)

&nbsp;

### Hiding the user's password

Possibility of hide and show the **password** field

![](/media/password_feature.png)

&nbsp;

### Basic Prophet commands

The three **Prophet** commands present on sidebar, without requiring the execution of these commands by the **Command Palette** of **VS Code**.

![](/media/prophet_commands.png)

&nbsp;

### Schema validation

**JSON schema** validation at start of the extension activation, when the sidebar **SFCC DW Helper** icon is clicked for the first time on a **VS Code** window. It check if all fields are of **string type** and if the field name is the correct.

![](/media/schema_validation.png)

&nbsp;

### Controls to compilers

Possibility to render until two buttons, for building code, per example, with custom label text and custom terminal commands, all configured on **Settings**, on **SFCC DW Helper** section.

The button only will be rendering if the toggle is enabled and both text fields fulfilled.

![](/media/settings_options.png)

&nbsp;

### History of inputted data on settings

The history of **Hostname** and **Code Version** inputted data, will be saved on **settings.json** on an arrays (**Hostname History** and **Codeversion History** respectively)

![](/media/history_settings.png)

&nbsp;

### Interact with environment Code Versions

Possibility to connect to **SalesForce Commerce Cloud**, via **OCAPI**, to get all **Code Versions** of the environment configured on **dw.json** to do:

- Get all **Code Versions** and see what is currently active
- Active a **Code Version** when click on them on list
- Create and delete **Code Versions** directly on environment

All necessary fields, **Client ID** and **Client Password** should be fulfilled to an successful connection to the environment.
For more information, the [**SalesForce Commerce Cloud** documentation can be accessed here](https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/OCAPI/current/usage/OAuth.html?cp=0_17_2_24).

![](/media/ocapi_settings.png)

In your environment, should be configured the **GET** method to `/code_versions` endpoint, used only to get **Code Versions**. The methods **PUT** and **DELETE**, should be configurated on `/code_versions/*` endpoint to excute all other operations related with **Code Versions**.

On **Business Manager**, search by **OCAPI** settings, later select the **Data API** and include the following object on your **Client ID** configuration:

```json
 {
    "resource_id": "/code_versions",
    "methods": ["get"],
    "read_attributes": "(**)",
    "write_attributes": "(**)"
},
{
    "resource_id": "/code_versions/*",
    "methods": ["put", "delete"],
    "read_attributes": "(**)",
    "write_attributes": "(**)"
}
```

With this feature you can see the current active **Code Version** on the environment. When an **Code Version** is choose, this one will be saved on your **Codeversion History**, like the original feature.
In case of any error to get the **Code Versions** via **OCAPI**, the original feature of access to **Codeversion History** will be automatically set.

For more information, please see the [**SalesForce Commerce Cloud** documentation can be accessed here](https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/OCAPI/current/data/Resources/CodeVersions.html?cp=0_17_4_11)

#### List of Code Versions to select

![](/media/get_codeversions_ocapi.png)

#### Create a new Code Version

![](/media/create_codeversion.png)

#### Select a Code Version to delete

![](/media/delete_codeversion.png)

&nbsp;

## Extension Settings

All necessary configurations of the extension will be automatically updated on the user's `settings.json`, when the star button is clicked:

- `sfcc-dw-helper.enableDevBuildBtn`: Enable/Disable the button on sidebar with custom command for build code in **Development** compiler
- `sfcc-dw-helper.enablePrdBuildBtn`: Enable/Disable the button on sidebar with custom command for build code in **Production** compiler
- `sfcc-dw-helper.commandDevBuildBtn`: Command for build code in **Development** compiler
- `sfcc-dw-helper.commandPrdBuildBtn`: Command for build code in **Production** compiler
- `sfcc-dw-helper.textDevBuildBtn`: Text for the build code button in **Development** compilerr
- `sfcc-dw-helper.textPrdBuildBtn`: Text for the build code button in **Production** compiler
- `sfcc-dw-helper.hostnameHistory`: Array with the history of last 10 introduced **Hotsname**
- `sfcc-dw-helper.codeversionHistory`: Array with the history of last 20 introduced **Code Version**
- `sfcc-dw-helper.ocapiClientId`: Value of the **OCAPI** Client Id
- `sfcc-dw-helper.ocapiClientPassword`: Value of the **OCAPI** Client Password

&nbsp;

## Known Issues

None, until now.

&nbsp;

## Release Notes

## [0.0.39]

- **MAJOR UPDATE**: Migrated from webview-based UI to VSCode native tree views
- Replaced dual-tab interface (Bracket/Settings) with four separate tree view sections
- New tree view structure:
    - **Connection Settings**: Edit hostname, code version, username, and password
    - **Prophet Commands**: Execute Clean/Upload, Enable/Disable Upload commands
    - **Environment**: Open Business Manager/StoreFront, manage code versions
    - **Compiler**: Execute custom build commands
- Improved UI consistency with VSCode's native SCM-like interface
- Click on tree items to edit fields or execute commands
- All existing functionality preserved with better organization

## [0.0.38]

- Minor fixes on font type of extension

## [0.0.37]

- Minor fixes on font type of extension

## [0.0.36]

- Minor fixes on font type of extension

## [0.0.35]

- Minor fixes on font type of extension

## [0.0.34]

- Minor fixes on font type of extension and minor improvement on popup to delete an Code Version

## [0.0.33]

- Implemented await-to-js lib for easy error handling

## [0.0.32]

- Implemented cache to access token to improve performance

## [0.0.31]

- Fix minor layout issue

## [0.0.30]

- Added new loading animation
- Added loading when is connecting the environment to create and delete code versions
- Fix minor layout issues

## [0.0.29]

- Fix bug when try to open webview of extension on a window without workspace open
- Improvements on quickpick of Code Version selection when is getting information from environment
- Added loading information when clicks to get Code Versions of an environment

## [0.0.28]

- Minor layout fixes

## [0.0.27]

- Added shortcuts to Business Manager and Storefront on main screen
- Added shortcut to extension settings on settings screen
- Minor refactor to delete useless code

## [0.0.26]

- Minor fix to disable code uploading when any compile buttons is clicked
- Minor improvements on icons of history and show/hide password

## [0.0.25]

- Added a status bar info about the connection to environment status
- Minor improvements on some features

## [0.0.24]

- Minor layout fixes

## [0.0.23]

- Minor layout fixes

## [0.0.22]

- Major code refactor
- New design of extension, similar to my other **VS Code Extension** [**SFCC Docs**](https://marketplace.visualstudio.com/items?itemName=ttrodrigues.sfcc-docs)

## [0.0.21]

- Add improvement to disable code upload when changing the `dw.json` file or when select another **hostname** or **code version**

## [0.0.20]

- Add the functionality to activate the **Code Version**, when is connected to an **hostname**
- Add the functionality to create and delete **Code Versions** of the current **hostname**

## [0.0.19]

- Add the functionality to get the **Code Versions** of the current **hostname**

## [0.0.18]

- Layout fixes

## [0.0.17]

- Minor fixes

## [0.0.16]

- Refactoring code

## [0.0.15]

- Minor fixes on sidebar layout

## [0.0.14]

- Minor fixes on sidebar layout

## [0.0.13]

- Minor fixes on sidebar collapse feature

## [0.0.12]

- Implementation of history for **Hostname** and **Code Version** fields
- Selection of user inputted history by **QuickPick**
- Implementation of collapse sections on sidebar

## [0.0.11]

- Initial production release
- Possibility to execute compiler commands
- Possibility to execute **Prophet** commands

## [0.0.1] - [0.0.10]

- Beta releases
