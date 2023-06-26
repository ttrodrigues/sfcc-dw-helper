# SFCC-DW-Helper
Small extension to help the **SFCC (SalesForce Commerce Cloud)** developers, to edit the **dw.json** file and run commands of **Prophet**.

&nbsp;

&nbsp;

## Why this Extension?
Simplify the life to **SFCC developers**, with an extension that provides direct edition of **dw.json** and the possibility of run **Prophet** commands on the same sidebar.

The extension validates the mandatory fields that the **dw.json** require to connect with an **SFCC** environment, that are necessary for **Prophet** uploads the code and to start a debug.

|Field |Required|Is Validated?|
|-----|:------:|:------:|
|hostname|![](/media/svg_checkmark_green.png)    |![](/media/svg_checkmark_green.png)      |
|code-version  |![](/media/svg_checkmark_green.png)       |![](/media/svg_checkmark_green.png)     |
|username  |![](/media/svg_checkmark_green.png)       |![](/media/svg_checkmark_green.png)     |
|password  |![](/media/svg_checkmark_green.png)       |![](/media/svg_checkmark_green.png)     |

The main commands **Clean Project/Upload All**, **Enable Upload** and **Disable Upload**, are present on the sidebar, for quick execution of them.

For simplify the work of the developers, it's possible to enable until two custom buttons, configured on settings on section **SFCC DW Helper**. These buttons will only run terminal commands.

&nbsp;

&nbsp;

## Features
Edition of **dw.json** directly on the sidebar

![](/media/edit_json.png)

&nbsp;

Possibility of hide and show the **password** field

![](/media/password_feature.png)

&nbsp;

The three **Prophet** commands present on sidebar, without requiring the execution of these commands by the **Command Palette** of **VS Code**. 

![](/media/prophet_commands.png)

&nbsp;

JSON schema validation at start of the extension activation, when the sidebar **SFCC DW Helper** icon is clicked for the first time on a **VS Code** window. It check if all fields are of **string type** and if the field name is the correct. 

![](/media/schema_validation.png)

&nbsp;

Possibility to render until two buttons, for building code, per example, with custom label text and custom terminal commands, all configured on **Settings**, on **SFCC DW Helper** section.

The button only will be rendering if the toggle is enabled and both text fields fulfilled.

![](/media/settings_options.png)

&nbsp;

The history of **Hostname** and **Code Version** inputted data, will be saved on **settings.json** on an arrays (**Hostname History** and **Codeversion History** respectively)

![](/media/history_settings.png)

&nbsp;

&nbsp;

## Next developments
* Possibility of integrate more **Prophet** commands dynamically
