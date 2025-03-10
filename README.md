# LLMProject

LLMProject is a Visual Studio Code extension designed to enhance your development workflow by allowing you to manage project contexts effectively. This extension enables you to create, modify, and export contexts that can be used in conjunction with Large Language Models (LLMs) to boost your development process.

## Features

- **Copy File Path and Content**: Easily copy the relative file path and its content in a formatted way to the clipboard.
- **Markdown Code Blocks**: Automatically formats the file content in a Markdown code block based on the file's extension.
- **Context Management**: Create, delete, rename, and edit descriptions of contexts to organize your project files.
- **Add Files and Folders to Contexts**: Quickly add individual files or entire folders to specific contexts for better organization.
- **Export Contexts**: Export the contents of a context to the clipboard in a structured format.
- **Context Menu Integration**: Access commands directly from the context menu in the Explorer view.

## Installation

1. Open Visual Studio Code.
2. Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window or pressing `Ctrl+Shift+X`.
3. Search for `LLMProject` and click on the Install button.

## Usage

### Command Palette

1. Open the Command Palette by pressing `Ctrl+Shift+P`.
2. Type the desired command, such as `Create New Context`, `Delete Context`, `Rename Context`, `Add File to Context`, or `Export Context`, and select it.

### Keybindings

You can also use the following keybindings:
- **Copy File Path and Content**:
  - **Windows/Linux**: `Ctrl+Shift+C`
  - **Mac**: `Cmd+Shift+C`
- **Export Context**:
  - **Windows/Linux**: `Ctrl+Shift+E`
  - **Mac**: `Cmd+Shift+E`

These keybindings will copy the relative path and content of the currently active file to the clipboard or export the selected context to the clipboard.

### Context Menu

Right-click on any file in the Explorer view to access options such as:
- **Copy File Path and Content**
- **Add File to Context**

You can also manage contexts by right-clicking on a context in the LLM Contexts view to delete, rename, or export it.

## Context Management

- **Creating a Context**: Use the command palette or context menu to create a new context.
- **Deleting a Context**: Select a context and choose the delete option from the context menu.
- **Renaming a Context**: Select a context and choose the rename option from the context menu.
- **Editing Context Descriptions**: Select a context and choose the edit description option from the context menu.
- **Adding Files/Folders to Contexts**: Use the add file or add folder commands to include files in a selected context.
- **Exporting Contexts**: Use the export command to copy the context details to the clipboard.

## Configuration

No additional configuration is required. The extension works out of the box.

## Development

If you would like to contribute to this extension, follow these steps:

1. Clone the repository.
2. Install the dependencies using `npm install`.
3. Open the project in Visual Studio Code.
4. Press `F5` to start debugging the extension.

### Running Tests

Run the tests using the following command:

```bash
npm test
```