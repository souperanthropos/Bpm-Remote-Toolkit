# cliowrapper

Расширение позволяет автоматически создавать и устанавливать пакеты с расширением **.gz** на целевой среде.

## Features

#### Создание пакета:

Чтобы сгенерировать пакет, в области **Workspace** Visual Studio Code щелкните правой кнопкой на папке с именем пакета и выберите **Create Package**

![Create Package](images/create_package.png)

#### Создание и отправка пакета:

Чтобы сгенерировать и отправить пакет на целевую среду, в области **Workspace** Visual Studio Code щелкните правой кнопкой на папке с именем пакета и выберите **Create Package And Send To Test Server**

![Create Package And Send](images/create_package_and_send.png)

## Requirements

Для корректной работы необходимо установить **clio** с помощью следующей команды:

`dotnet tool install clio -g`

> Command Line Interface clio is the utility for integration Creatio platform with development and CI/CD tools.

## Extension Settings

Это расширение добавляет следующие настройки:

* `clio.outputPath`: Specify output full path for .gz file.
* `clio.bpmSoft.test.login`: Bpmsoft account login for test app.
* `clio.bpmSoft.test.password`: Bpmsoft account password for test app.

## Known Issues

NONE

## Release Notes

### 1.0.0

Initial release

### 1.1.0

Исправление кодировки при выводе выходных данных в терминале

### 1.2.0

Группировка пунктов меню для **Создание и отправка пакета**
