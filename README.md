## Overview

*LogViewer* is a Node.js-based application designed to simplify log monitoring across multiple environments. The application is launched directly from the terminal and provides a seamless way to view and analyze log files. 

Each log entry is color-coded based on its type (such as **Info**, **Debug**, **Warning**, and **Error**) to improve readability and facilitate efficient debugging. Users can customize log colors and define configurations to suit their needs.

### Key Features
- **Environment Management**: Define multiple environments and their respective log files for quick access.
- **Customizable Log Colors**: Use default colors or define your own color scheme for specific keywords in logs.
- **Terminal-based Simplicity**: No graphical interface—designed for lightweight and efficient operation in terminal environments.

## Getting Started
To start using *LogViewer*, run the application with the command:
```
node /path/to/log.js
```

## Configure LogViewer


To configure *LogViewer*, follow these steps:

1. Locate the `config.template.json` file in the repository.
2. Copy the template and save it as `config.json` in the application's directory.
3. Edit the `config.json` file to set up your environments and preferences:

### Applications
Define the applications you want to monitor. Each application includes:
- **`name_view`**: The display name for the application in the selection menu.
- **`name_real`**: The actual folder name of the application.
- **`folder`**: The full path to the application folder.

### Logs
Configure the log-related settings:
- **`logs.folder`**: The path to the log files, relative to the application folder.
- **`logs.colors`**: Set `true` to use default colors or define custom colors.
- **`logs.files`**: List the log files to be displayed, with:
  - **`name_view`**: The display name for the log file.
  - **`name_real`**: The real name of the log file.

### Default Colors
Define colors for specific keywords across all applications. Each color rule includes:
- **`keyword`**: The keyword to match in the logs.
- **`color`**: The color to apply to the matched keyword.
- **`keep`**: Whether to retain the last applied color until a new keyword is found.

4. Save your changes and restart the application.