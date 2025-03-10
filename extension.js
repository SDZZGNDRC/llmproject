const vscode = require('vscode');
const path = require('path');
const contextManager = require('./contextManager');
const ContextTreeDataProvider = require('./contextTreeView');

// This method is called when your extension is activated
function activate(context) {
    console.log('Congratulations, your extension "llmproject" is now active!');

    // 注册原有的复制文件路径和内容命令
    const copyFilePathAndContentDisposable = vscode.commands.registerCommand('llmproject.copyFilePathAndContent', async (uri) => {
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

    // 注册 Context TreeView
    const contextTreeDataProvider = new ContextTreeDataProvider();
    const treeView = vscode.window.createTreeView('llmContextView', {
        treeDataProvider: contextTreeDataProvider,
        showCollapseAll: true
    });

    // 注册创建 Context 命令
    const createContextDisposable = vscode.commands.registerCommand('llmproject.createContext', async () => {
        const name = await vscode.window.showInputBox({
            prompt: '输入新 Context 的名称',
            placeHolder: '新建 Context'
        });
        
        if (name !== undefined) {
            await contextManager.createContext(name);
        }
    });

    // 注册删除 Context 命令
    const deleteContextDisposable = vscode.commands.registerCommand('llmproject.deleteContext', async (item) => {
        if (item && item.id) {
            const confirmed = await vscode.window.showWarningMessage(
                `确定要删除 Context "${item.label}" 吗？`,
                { modal: true },
                '删除'
            );
            
            if (confirmed === '删除') {
                await contextManager.deleteContext(item.id);
            }
        }
    });

    // 注册重命名 Context 命令
    const renameContextDisposable = vscode.commands.registerCommand('llmproject.renameContext', async (item) => {
        if (item && item.id) {
            const newName = await vscode.window.showInputBox({
                prompt: '输入新名称',
                value: item.label
            });
            
            if (newName !== undefined) {
                await contextManager.renameContext(item.id, newName);
            }
        }
    });

    // 注册编辑 Context 描述命令
    const editContextDescriptionDisposable = vscode.commands.registerCommand('llmproject.editContextDescription', async (item) => {
        if (item && item.id) {
            const context = contextManager.getContextById(item.id);
            if (context) {
                const newDescription = await vscode.window.showInputBox({
                    prompt: '编辑 Context 描述',
                    value: context.description
                });
                
                if (newDescription !== undefined) {
                    await contextManager.updateContextDescription(item.id, newDescription);
                }
            }
        }
    });

    // 注册添加文件到 Context 命令
    const addFileToContextDisposable = vscode.commands.registerCommand('llmproject.addFileToContext', async (uri) => {
        if (!uri || uri.scheme !== 'file') {
            if (!vscode.window.activeTextEditor) {
                vscode.window.showErrorMessage('请选择一个文件');
                return;
            }
            uri = vscode.window.activeTextEditor.document.uri;
        }

        const contexts = contextManager.getContexts();
        if (contexts.length === 0) {
            const createNew = await vscode.window.showInformationMessage(
                '没有可用的 Context，是否创建新的 Context？',
                '创建'
            );
            
            if (createNew === '创建') {
                const name = await vscode.window.showInputBox({
                    prompt: '输入新 Context 的名称',
                    placeHolder: '新建 Context'
                });
                
                if (name !== undefined) {
                    const newContext = await contextManager.createContext(name);
                    await contextManager.addFileToContext(newContext.id, uri.fsPath);
                }
            }
        } else {
            const items = contexts.map(c => ({
                label: c.name,
                description: c.description,
                id: c.id
            }));
            
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: '选择要添加到的 Context'
            });
            
            if (selected) {
                await contextManager.addFileToContext(selected.id, uri.fsPath);
                vscode.window.showInformationMessage(`文件已添加到 Context "${selected.label}"`);
            }
        }
    });

    // 注册添加文件夹到 Context 命令
    const addFolderToContextDisposable = vscode.commands.registerCommand('llmproject.addFolderToContext', async (uri) => {
        if (!uri) {
            uri = await vscode.window.showOpenDialog({
                canSelectFiles: false,
                canSelectFolders: true,
                canSelectMany: false,
                openLabel: '选择文件夹'
            }).then(uris => uris && uris[0]);
            
            if (!uri) return;
        }

        const contexts = contextManager.getContexts();
        if (contexts.length === 0) {
            const createNew = await vscode.window.showInformationMessage(
                '没有可用的 Context，是否创建新的 Context？',
                '创建'
            );
            
            if (createNew === '创建') {
                const name = await vscode.window.showInputBox({
                    prompt: '输入新 Context 的名称',
                    placeHolder: '新建 Context'
                });
                
                if (name !== undefined) {
                    const newContext = await contextManager.createContext(name);
                    await contextManager.addFolderToContext(newContext.id, uri.fsPath);
                }
            }
        } else {
            const items = contexts.map(c => ({
                label: c.name,
                description: c.description,
                id: c.id
            }));
            
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: '选择要添加到的 Context'
            });
            
            if (selected) {
                await contextManager.addFolderToContext(selected.id, uri.fsPath);
                vscode.window.showInformationMessage(`文件夹已添加到 Context "${selected.label}"`);
            }
        }
    });

    // 注册从 Context 中移除文件命令
    const removeFileFromContextDisposable = vscode.commands.registerCommand('llmproject.removeFileFromContext', async (item) => {
        if (item && item.id) {
            const [contextId, filePath] = item.id.split('|');
            await contextManager.removeFileFromContext(contextId, filePath);
        }
    });

    // 注册导出 Context 命令
    const exportContextDisposable = vscode.commands.registerCommand('llmproject.exportContext', async (item) => {
        if (!item || !item.id) {
            vscode.window.showErrorMessage('请选择一个 Context 进行导出');
            return;
        }

        const output = await contextManager.exportContext(item.id);
        if (output) {
            await vscode.env.clipboard.writeText(output);
            vscode.window.showInformationMessage(`Context "${item.label}" 已导出到剪贴板`);
        } else {
            vscode.window.showErrorMessage('导出 Context 失败');
        }
    });

    // 注册所有命令
    context.subscriptions.push(
        copyFilePathAndContentDisposable,
        createContextDisposable,
        deleteContextDisposable,
        renameContextDisposable,
        editContextDescriptionDisposable,
        addFileToContextDisposable,
        addFolderToContextDisposable,
        removeFileFromContextDisposable,
        exportContextDisposable,
        treeView
    );
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
};
