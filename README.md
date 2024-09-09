# BPM Remote Toolkit

The extension creates packages with the extension **.gz** and installs them in the target environment.

Support Creatio and BPMSoft.

## Features

#### Create Package:

In the **Workspace** area of Visual Studio Code, right-click on the folder and select **Create Package**

#### Create And Send Package:

In the **Workspace** area of Visual Studio Code, right-click on the folder and select **Create Package And Send**

## Requirements

### For Creatio

Install clio before using the extension:

`dotnet tool install clio -g`

> Command Line Interface clio is the utility for integration Creatio platform with development and CI/CD tools.

### For BPMSoft

Download Utilities Of BPMSoft and register this utility before using the extension:

- Run the **ubs.exe** application as an administrator in the folder where the archive was unzipped;
- In the console window, type **register**, press Enter, then Enter again to close the console;

## Extension Settings

This extension contributes the following settings:

* `bpmtoolkit.general.utility`: Select utility: **clio** or **ubs**
* `bpmtoolkit.general.autoUpdateTime`: When saving changes to cs or js files, automatically updates the ModifiedOnUtc field in the Descriptor.json file.
* `bpmtoolkit.general.outputPath`: Specify output full path for .gz file.

## Settings For .code-workspace file

- `id`: Identifier web application
- `url`: Web application url address.
- `isNetCore`: Target platform (**true** for .NET Core, **false** for .NET Framework)
- `gitBranchName`: Name of the branch associated with the target environment.
- `isEnable`: Availability of actions in view area **Bpm Environments**.

**For example**:

```json
{
	"folders": [
		{
			"path": "Dev-Folder"
		}
	],
	"settings": {
		"bpmtoolkit": {
			"environments": [
				{
					"id": "test",
					"url": "https://test.contoso.com",
					"isNetCore": false,
					"gitBranchName": "test",
					"isEnable": true
				},
				{
					"id": "preprod",
					"url": "https://preprod.contoso.com",
					"isNetCore": false,
					"gitBranchName": "preprod",
					"isEnable": true
				},
				{
					"id": "prod",
					"url": "https://prod.contoso.com",
					"isNetCore": false,
					"gitBranchName": "master",
					"isEnable": false
				}
			]
		}
	}
}
```

> You need to set up the file `.code-workspace` to display items in view **Bpm Environments**.

## Known Issues

NONE

## Release Notes

## 1.7.x

- Update README
- Added support Utilities Of BPMSoft (UBS)
- Updated extension display name and icon
- Updated .code-workspace file structure
- Minor corrections and improvements