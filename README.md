# SFCC-DW-Helper
Small extension to help the **SFCC (SalesForce Commerce Cloud)** developers, to edit the **dw.json** file and run commands of **Prophet**.

&nbsp;

&nbsp;

## Why this Extension?
Simplify the life to **SFCC developers**, with an extension that provides direct edition of **dw.json** and the possibility of run **Prophet** commands on the same sidebar.

The extension validates the mandatory fields that the **dw.json** require to connect with an **SFCC** environment, that are necessary for **Prophet** uploads the code and to start a debug.

|Field |Required|Is Validated?|
|-----|:------:|:------:|
|hostname|:white_check_mark:      |:white_check_mark:    |
|code-version  |:white_check_mark:     |:white_check_mark:   |
|username  |:white_check_mark:     |:white_check_mark:   |
|password  |:white_check_mark:     |:white_check_mark:   |

The main commands **Clean Project/Upload All**, **Enable Upload** and **Disable Upload**, are present on the sidebar, for quick execution of them.

&nbsp;

&nbsp;

## Features
Edition of **dw.json** directly on the sidebar

![](/media/edit_json.png)

&nbsp;

Possibility of hide and show the **password** field

![](/media/password_show_hide_gif.gif)

&nbsp;

The three **Prophet** commands present on sidebar, without requiring the execution of these commands by the **Command Palette** of **VS Code**. 

![](/media/prophet_commands.png)

&nbsp;

JSON schema validation at start of the extension activation, when the sidebar **SFCC DW Helper** icon is clicked for the first time on a **VS Code** window. It check if all fields are of **string type** and if the field name is the correct. 

![](/media/schema_validation.png)

&nbsp;

&nbsp;

## Next developments
* Possibility to save the **hostname** and **codeversion** introduced by user
* Integrate more **Prophet** commands, if seems necessary
