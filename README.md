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

Possibility to connect to **SalesForce Commerce Cloud**, via **OCAPI**, to get all **Code Versions** of the environment configured on **dw.json**. All necessary fields, **Client ID** and **Client Password** should be fulfilled to an successful connection to the environment.
For more information, the [**SalesForce Commerce Cloud** documentation can be accessed here](https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/OCAPI/current/usage/OAuth.html?cp=0_17_2_24).

![](/media/ocapi_settings.png)

&nbsp;

In your environment, should be configured the **GET** method to **Code Versions**. On **Business Manager**, search by **OCAPI** settings,* later select the **Data API** and include the following object on your **Client ID** configuration:
```json
 {
    "resource_id": "/code_versions",
    "methods": [
        "get"
    ],
    "read_attributes": "(**)",
    "write_attributes": "(**)"
}
```
With this feature you can see the current active **Code Version** on the environment. When an **Code Version** is choose, this onewill be saved on your **Codeversion History**, like the original feature. 
In case of any error to get the **Code Versions** via **OCAPI**, the original feature of access to **Codeversion History** will be automatically set.

For more information, please see the [**SalesForce Commerce Cloud** documentation can be accessed here](https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/OCAPI/current/data/Resources/CodeVersions.html?cp=0_17_4_11) 

![](/media/get_codeversions_ocapi.png)

&nbsp;

&nbsp;

## Next developments
* Possibility of integrate more **Prophet** commands dynamically
