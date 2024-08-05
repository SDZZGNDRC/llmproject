const vscode = require('vscode');
const path = require('path');

// This method is called when your extension is activated
function activate(context) {
    console.log('Congratulations, your extension "llmproject" is now active!');

    const disposable = vscode.commands.registerCommand('llmproject.copyFilePathAndContent', async (uri) => {
        // 如果没有传递 uri 参数，则尝试从活动编辑器中获取
        if (!uri) {
			if (!vscode.window.activeTextEditor) {
				return;
			}
            uri = vscode.window.activeTextEditor.document.uri;
        }

        if (uri && uri.scheme === 'file') {
            const filePath = uri.fsPath;
            const relativePath = path.relative(vscode.workspace.rootPath || '', filePath);
            const fileExtension = path.extname(filePath).slice(1); // 获取文件扩展名并去除开头的点

            try {
                // 读取文件内容
                const fileContent = await vscode.workspace.fs.readFile(uri);
                const content = fileContent.toString();

                // 根据文件扩展名选择对应的Markdown代码块
                let codeBlock = '';
                if (fileExtension) {
                    codeBlock = `\`\`\`${fileExtension}\n${content}\n\`\`\``; // 使用代码块
                } else {
                    codeBlock = content; // 如果没有扩展名，直接使用内容
                }

                // 组合路径和内容
                const clipboardContent = `相对路径: ${relativePath}:\n${codeBlock}\n`;
                
                // 将内容写入剪贴板
                await vscode.env.clipboard.writeText(clipboardContent);
                vscode.window.showInformationMessage('文件路径和内容已复制到剪贴板');
            } catch (error) {
                vscode.window.showErrorMessage('读取文件内容失败: ' + error.message);
            }
        } else {
            vscode.window.showErrorMessage('无法获取文件路径，请确保在编辑器中打开了一个文件或从资源管理器中右键点击文件。');
        }
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
}
