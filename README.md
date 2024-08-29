# cliowrapper

The extension creates packages with the extension **.gz** and installs them in the target environment.

## Features

#### Create Package:

In the **Workspace** area of Visual Studio Code, right-click on the folder and select **Create Package**

#### Create And Send Package:

In the **Workspace** area of Visual Studio Code, right-click on the folder and select **Create Package And Send**

## Requirements

Install clio before using the extension:

`dotnet tool install clio -g`

> Command Line Interface clio is the utility for integration Creatio platform with development and CI/CD tools.

## Extension Settings

This extension contributes the following settings:

* `clio.autoUpdateTime`: When saving changes to cs or js files, automatically updates the ModifiedOnUtc field in the Descriptor.json file.
* `clio.outputPath`: Specify output full path for .gz file.

## Settings For .code-workspace file

- `id`: Identifier web application
- `url`: Web application url address.
- `gitBranchName`: Name of the branch associated with the target environment.
- `isEnable`: Availability of actions in view area **Bpmsoft Environments**.

**For example**:

```json
{
	"folders": [
		{
			"path": "Dev-Folder"
		}
	],
	"settings": {
		"cwSettings": {
			"cwEnvironments": [
				{
					"id": "test",
					"url": "https://test.contoso.com",
					"gitBranchName": "test",
					"isEnable": true
				},
				{
					"id": "preprod",
					"url": "https://preprod.contoso.com",
					"gitBranchName": "preprod",
					"isEnable": true
				},
				{
					"id": "prod",
					"url": "https://prod.contoso.com",
					"gitBranchName": "master",
					"isEnable": false
				}
			]
		}
	}
}
```

> You need to set up the file `.code-workspace` to display items in view **Bpmsoft Environments**.

## Known Issues

NONE

## Release Notes

## 1.6.x

- Update README
- Added new extension setting: `clio.autoUpdateTime`
