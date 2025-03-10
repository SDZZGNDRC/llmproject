const vscode = require('vscode');
const path = require('path');
const contextStorage = require('./contextStorage');
const { v4: uuidv4 } = require('uuid');

class ContextManager {
    constructor() {
        this.contexts = [];
        this._onDidChangeContexts = new vscode.EventEmitter();
        this.onDidChangeContexts = this._onDidChangeContexts.event;
        this.loadContexts();
    }

    async loadContexts() {
        this.contexts = await contextStorage.getAllContexts();
        this._onDidChangeContexts.fire();
    }

    async createContext(name) {
        const newContext = {
            id: uuidv4(),
            name: name || '新建 Context',
            description: '',
            files: []
        };

        this.contexts.push(newContext);
        await contextStorage.saveContext(newContext);
        this._onDidChangeContexts.fire();
        return newContext;
    }

    async deleteContext(contextId) {
        const index = this.contexts.findIndex(c => c.id === contextId);
        if (index !== -1) {
            this.contexts.splice(index, 1);
            await contextStorage.deleteContext(contextId);
            this._onDidChangeContexts.fire();
        }
    }

    async renameContext(contextId, newName) {
        const context = this.contexts.find(c => c.id === contextId);
        if (context) {
            context.name = newName;
            await contextStorage.saveContext(context);
            this._onDidChangeContexts.fire();
        }
    }

    async updateContextDescription(contextId, description) {
        const context = this.contexts.find(c => c.id === contextId);
        if (context) {
            context.description = description;
            await contextStorage.saveContext(context);
            this._onDidChangeContexts.fire();
        }
    }

    async addFileToContext(contextId, filePath) {
        const context = this.contexts.find(c => c.id === contextId);
        if (!context) return;

        const workspaceRoot = vscode.workspace.workspaceFolders && 
                             vscode.workspace.workspaceFolders[0] && 
                             vscode.workspace.workspaceFolders[0].uri.fsPath;
        const relativePath = workspaceRoot ? path.relative(workspaceRoot, filePath) : filePath;
        
        // 检查文件是否已存在于 Context 中
        if (!context.files.some(f => f.path === relativePath)) {
            context.files.push({
                path: relativePath,
                added: new Date().toISOString()
            });
            
            await contextStorage.saveContext(context);
            this._onDidChangeContexts.fire();
        }
    }

    async addFolderToContext(contextId, folderPath) {
        const context = this.contexts.find(c => c.id === contextId);
        if (!context) return;

        const workspaceRoot = vscode.workspace.workspaceFolders && 
                             vscode.workspace.workspaceFolders[0] && 
                             vscode.workspace.workspaceFolders[0].uri.fsPath;
        
        // 获取文件夹下的所有文件
        const files = await vscode.workspace.findFiles(
            new vscode.RelativePattern(folderPath, '**/*'),
            '**/node_modules/**'
        );

        for (const file of files) {
            const relativePath = workspaceRoot ? path.relative(workspaceRoot, file.fsPath) : file.fsPath;
            
            // 检查文件是否已存在于 Context 中
            if (!context.files.some(f => f.path === relativePath)) {
                context.files.push({
                    path: relativePath,
                    added: new Date().toISOString()
                });
            }
        }
        
        await contextStorage.saveContext(context);
        this._onDidChangeContexts.fire();
    }

    async removeFileFromContext(contextId, filePath) {
        const context = this.contexts.find(c => c.id === contextId);
        if (!context) return;

        const index = context.files.findIndex(f => f.path === filePath);
        if (index !== -1) {
            context.files.splice(index, 1);
            await contextStorage.saveContext(context);
            this._onDidChangeContexts.fire();
        }
    }

    async exportContext(contextId) {
        const context = this.contexts.find(c => c.id === contextId);
        if (!context) return '';

        const workspaceRoot = vscode.workspace.workspaceFolders && 
                             vscode.workspace.workspaceFolders[0] && 
                             vscode.workspace.workspaceFolders[0].uri.fsPath;
        if (!workspaceRoot) return '';

        let output = `# ${context.name}\n`;
        if (context.description) {
            output += `${context.description}\n\n`;
        }
        
        output += `## 包含文件\n`;

        for (const file of context.files) {
            try {
                const fullPath = path.join(workspaceRoot, file.path);
                const fileUri = vscode.Uri.file(fullPath);
                const fileExtension = path.extname(fullPath).slice(1); // 获取文件扩展名并去除开头的点
                
                // 读取文件内容
                const fileContent = await vscode.workspace.fs.readFile(fileUri);
                const content = fileContent.toString();
                
                // 根据文件扩展名选择对应的Markdown代码块
                let codeBlock = '';
                if (fileExtension) {
                    codeBlock = `\`\`\`${fileExtension}\n${content}\n\`\`\``;
                } else {
                    codeBlock = content;
                }
                
                output += `\n相对路径: ${file.path}:\n${codeBlock}\n`;
            } catch (error) {
                output += `\n相对路径: ${file.path}:\n(无法读取文件内容: ${error.message})\n`;
            }
        }
        
        return output;
    }

    getContexts() {
        return this.contexts;
    }

    getContextById(contextId) {
        return this.contexts.find(c => c.id === contextId);
    }
}

module.exports = new ContextManager(); 