# cliowrapper

The extension creates packages with the extension **.gz** and installs them in the target environment.

## Features

#### Create Package:

In the **Workspace** area of Visual Studio Code, right-click on the folder and select **Create Package**

#### Create And Send Package:

In the **Workspace** area of Visual Studio Code, right-click on the folder and select the additional menu item with the target environment in **Create Package And Send To**

## Requirements

Install clio before using the extension:

`dotnet tool install clio`

> Command Line Interface clio is the utility for integration Creatio platform with development and CI/CD tools.

## Extension Settings

This extension contributes the following settings:

* `clio.outputPath`: Specify output full path for .gz file.
* `clio.bpmSoft.test.login`: Bpmsoft account login for test app.
* `clio.bpmSoft.test.password`: Bpmsoft account password for test app.
* `clio.bpmSoft.preprod.login`: Bpmsoft account login for preprod app.
* `clio.bpmSoft.preprod.password`: Bpmsoft account password for preprod app.
* `clio.bpmSoft.prod.login`: Bpmsoft account login for prod app.
* `clio.bpmSoft.prod.password`: Bpmsoft account password for prod app.

## Settings For .code-workspace file

* `cwServers.test`: Configuration for the test environment.
* `cwServers.preprod`: Configuration of the pre-production environment.
* `cwServers.prod`: Configuration of the production environment.

- `url`: Web application url address
- `branchName`: Name of the branch associated with the target environment

**For example**:

```json
{
	"folders": [
		{
			"path": "Dev-Folder"
		}
	],
	"settings": {
		"cwServers.test": {
			"url": "https://test.contoso.com",
			"branchName": "develop"
		},
		"cwServers.preprod": {
			"url": "https://preprod.contoso.com",
			"branchName": "preprod"
		},
		"cwServers.prod": {
			"url": "https://prod.contoso.com",
			"branchName": "master"
		}
	}
}
```

> You need to set up the file `.code-workspace` to display menu item **Create Package And Send To**.

## Known Issues

NONE

## Release Notes

### 1.0.0

- Initial release

### 1.1.0

- Corrects encoding when outputting data in the terminal

### 1.2.0

- Grouping of menu items for **Сreation and sending package**

## 1.3.0

- Minor corrections and improvements
- Added logic for **test**, **preprod** and **prod** configurations
