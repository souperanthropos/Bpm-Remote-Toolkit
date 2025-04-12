# BPM Remote Toolkit

The extension creates packages with the extension **.gz** and installs them in the target environment.

Support Creatio and BPMSoft.

## How it works

1. Setup you .code-workspace file:
	- set property `path`: set the path to custom packages, example `..\Terrasoft.WebApp\Terrasoft.Configuration\Pkg`
	- add enviroments
2. Log in to each environment in the Bpm Environments view.
3. Open you .code-workspace file by Visual Studio Code and add folders from File Explorer in Packages Explorer by right-click on the folder and select **Add Folder To Packages Explorer**.
4. In Package Explorer, you can:
	- create selected package
	- create and upload selected package
	- add package to deploy (supported multiselect)
5. Package deployment management is for the sequential deployment of multiple packages.

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
* `bpmtoolkit.general.outputPath`: Specify output full path for .gz file. If empty, the extension folder is used.

## Settings For .code-workspace file

- `id`: Identifier web application
- `url`: Web application url address.
- `isNetCore`: Target platform (**true** for .NET Core, **false** for .NET Framework)
- `gitBranchName`: Name of the branch associated with the target environment.
- `isEnable`: Availability of actions in view area **Bpm Environments**.
- `postRunCommand`: Command to be executed in the terminal after deploying packages to the target environment. This can be used for additional actions, such as running custom scripts.

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

> You need to set up the file `.code-workspace` to display items in view **Bpm Environments**.

## Known Issues

- If the Package Deployment Management view is empty, drag and drop from Package Explorer to Package Deployment Management does not work.

## Release Notes

## 1.8.x

- Update README
- Added view **Package Deployment Management** in **Source Control**
- Minor corrections and improvements