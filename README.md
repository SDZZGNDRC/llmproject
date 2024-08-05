# LLMProject

LLMProject is a Visual Studio Code extension designed to enhance your development workflow by allowing you to quickly copy the file path and content of the currently opened file. This feature is particularly useful for generating context when using Large Language Models (LLMs) to boost your development process.

## Features

- **Copy File Path and Content**: Easily copy the relative file path and its content in a formatted way to the clipboard.
- **Markdown Code Blocks**: Automatically formats the file content in a Markdown code block based on the file's extension.
- **Context Menu Integration**: Access the command directly from the context menu in the Explorer view.

## Installation

1. Open Visual Studio Code.
2. Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window or pressing `Ctrl+Shift+X`.
3. Search for `LLMProject` and click on the Install button.

## Usage

### Command Palette

1. Open the Command Palette by pressing `Ctrl+Shift+P`.
2. Type `Copy File Path and Content` and select the command.

### Keybinding

You can also use the keybinding:
- **Windows/Linux**: `Ctrl+Shift+C`
- **Mac**: `Cmd+Shift+C`

This keybinding will copy the relative path and content of the currently active file to the clipboard.

### Context Menu

Right-click on any file in the Explorer view and select `Copy File Path and Content` to copy the file path and content.

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
