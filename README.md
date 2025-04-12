# BPM Remote Toolkit

The extension creates packages with the extension **.gz** and installs them in the target environment.

## Features

- Create and install packages in the target environment.
- Support for Creatio and BPMSoft platforms.
- Manage sequential deployment of multiple packages.
- Automatically update metadata when saving files.

## How it works

1. Set up your `.code-workspace` file:
   - Set the `path` property to the path of custom packages, e.g., `..\Terrasoft.WebApp\Terrasoft.Configuration\Pkg`.
   - Add environments.
2. Log in to each environment in the **Bpm Environments** view.
3. Open your `.code-workspace` file in Visual Studio Code and add folders from File Explorer to **Packages Explorer** by right-clicking on the folder and selecting **Add Folder To Packages Explorer**.
4. In **Package Explorer**, you can:
   - Create a selected package.
   - Create and upload a selected package.
   - Add packages for deployment (supports multiselect).
5. Use **Package Deployment Management** for sequential deployment of multiple packages.

## Requirements

### For Creatio

Install [clio](https://github.com/Advance-Technologies-Foundation/clio) before using the extension:

```bash
dotnet tool install clio -g
```

> Command Line Interface clio is the utility for integrating the Creatio platform with development and CI/CD tools.

### For BPMSoft

Download Utilities Of BPMSoft and register this utility before using the extension:

- Run the **ubs.exe** application as an administrator in the folder where the archive was unzipped.
- In the console window, type **register**, press Enter, then Enter again to close the console.

## Extension Settings

This extension contributes the following settings:

* `bpmtoolkit.general.utility`: Select utility: **clio** (for Creatio), **ubs** (for BPMSoft), or **auto** (for automatic detection of the utility based on the path).
* `bpmtoolkit.general.autoUpdateTime`: Automatically updates the `ModifiedOnUtc` field in the `Descriptor.json` file when saving `.cs` or `.js` files.
* `bpmtoolkit.general.packToZip`: If enabled, the `.gz` file is also compressed into a `.zip` file.

## Settings For .code-workspace file

- `id`: Identifier of the web application.
- `url`: Web application URL address.
- `isNetCore`: Target platform (**true** for .NET Core, **false** for .NET Framework).
- `gitBranchName`: Name of the branch associated with the target environment.
- `isEnable`: Availability of actions in the **Bpm Environments** view.

**For example**:

```json
{
	"folders": [
		{
			"path": "..\\Terrasoft.WebApp\\Terrasoft.Configuration\\Pkg"
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

> You need to set up the `.code-workspace` file to display items in the **Bpm Environments** view.

## Known Issues

- If the **Package Deployment Management** view is empty, drag-and-drop from **Package Explorer** to **Package Deployment Management** does not work. Ensure that packages are added to **Package Explorer**.

## Release Notes

### 1.8.x

- Updated README.
- Added the **Package Deployment Management** view in **Source Control**.
- Minor corrections and improvements.
