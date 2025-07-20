const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
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

    // 注册收集项目上下文命令
    const collectProjectContextDisposable = vscode.commands.registerCommand('llmproject.collectProjectContext', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('请先打开一个项目文件夹。');
            return;
        }
        const rootPath = workspaceFolders[0].uri.fsPath;

        vscode.window.showInformationMessage('正在收集项目上下文...');

        try {
            // 1. 读取 .ignore 文件
            const ignorePath = path.join(rootPath, '.llmproject', '.ignore');
            let ignorePatterns = [];
            if (fs.existsSync(ignorePath)) {
                const ignoreContent = fs.readFileSync(ignorePath, 'utf-8');
                ignorePatterns = ignoreContent.split(/\r?\n/).filter(line => line.trim() !== '' && !line.startsWith('#'));
            }

            // 辅助函数：检查路径是否应该被忽略
            const isIgnored = (filePath) => {
                const relativePath = path.relative(rootPath, filePath);
                // 始终忽略 .git 和 .llmproject 文件夹
                if (relativePath.startsWith('.git') || relativePath.startsWith('.llmproject')) {
                    return true;
                }
                for (const pattern of ignorePatterns) {
                    // 简单的匹配逻辑：检查路径是否以 pattern 结尾或包含 pattern
                    // 注意：这是一个简化的实现，不支持完整的 .gitignore 语法
                    if (relativePath.includes(pattern)) {
                        return true;
                    }
                }
                return false;
            };

            // 2. 获取项目结构和文件内容
            let projectStructure = '';
            const allFileContents = [];

            const traverseDir = (dir, prefix = '') => {
                const files = fs.readdirSync(dir);
                files.forEach((file, index) => {
                    const fullPath = path.join(dir, file);
                    if (isIgnored(fullPath)) {
                        return;
                    }

                    const isLast = index === files.length - 1;
                    projectStructure += `${prefix}${isLast ? '└── ' : '├── '}${file}\n`;

                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        traverseDir(fullPath, `${prefix}${isLast ? '    ' : '│   '}`);
                    } else {
                        const relativePath = path.relative(rootPath, fullPath);
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        const fileExtension = path.extname(fullPath).slice(1);
                        const codeBlock = `\n\`\`\`${fileExtension}\n${content}\n\`\`\``;
                        allFileContents.push(`文件路径: ${relativePath}:${codeBlock}`);
                    }
                });
            };

            projectStructure = `项目结构:\n\`\`\`\n${rootPath.split(path.sep).pop()}\n`;
            traverseDir(rootPath);
            projectStructure += '```\n';

            try {
                // 3. 拼接所有内容并复制
                const finalContent = projectStructure + '\n' + allFileContents.join('\n\n');
                await vscode.env.clipboard.writeText(finalContent);
                vscode.window.showInformationMessage('项目上下文已成功收集并复制到剪贴板！');
            } catch (e) {
                if (e instanceof RangeError) {
                    vscode.window.showWarningMessage('内容过大无法复制到剪贴板，将保存到文件中。');
                    const outputPath = path.join(rootPath, 'project_context.txt');
                    try {
                        const stream = fs.createWriteStream(outputPath);
                        stream.on('error', (writeError) => {
                            console.error('文件写入时出错:', writeError);
                            vscode.window.showErrorMessage('保存文件时出错: ' + writeError.message);
                        });
                        
                        stream.write(projectStructure + '\n');
                        allFileContents.forEach(content => {
                            stream.write(content + '\n\n');
                        });
                        stream.end();

                        stream.on('finish', () => {
                            vscode.window.showInformationMessage(`内容已保存到文件: ${outputPath}`);
                        });
                    } catch (fileError) {
                        console.error('创建文件流时出错:', fileError);
                        vscode.window.showErrorMessage('创建文件以保存上下文时出错: ' + fileError.message);
                    }
                } else {
                    // 重新抛出未预料到的错误
                    console.error('收集项目上下文时发生未知错误:', e);
                    vscode.window.showErrorMessage('收集项目上下文时出错: ' + e.message);
                }
            }
        } catch (error) {
            console.error('遍历目录或读取文件时出错:', error);
            vscode.window.showErrorMessage('收集项目上下文时出错: ' + error.message);
        }
    });

    // 注册所有命令
    context.subscriptions.push(
        collectProjectContextDisposable,
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
