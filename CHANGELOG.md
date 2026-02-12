# Change Log

## [0.0.40]

- **SECURITY UPDATE**: Fix the Axios and other dependencies version

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
