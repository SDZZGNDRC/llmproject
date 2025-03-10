const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

class ContextStorage {
    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders && 
                             vscode.workspace.workspaceFolders[0] && 
                             vscode.workspace.workspaceFolders[0].uri.fsPath;
        this.contextDir = this.workspaceRoot ? path.join(this.workspaceRoot, '.llmcontext') : null;
        this.ensureContextDirExists();
    }

    ensureContextDirExists() {
        if (this.contextDir && !fs.existsSync(this.contextDir)) {
            fs.mkdirSync(this.contextDir, { recursive: true });
        }
    }

    async getAllContexts() {
        if (!this.contextDir) {
            return [];
        }

        try {
            const files = fs.readdirSync(this.contextDir);
            const contextFiles = files.filter(file => file.endsWith('.json'));
            
            const contexts = [];
            for (const file of contextFiles) {
                const content = fs.readFileSync(path.join(this.contextDir, file), 'utf8');
                contexts.push(JSON.parse(content));
            }
            
            return contexts;
        } catch (error) {
            console.error('读取 Context 文件失败:', error);
            return [];
        }
    }

    async saveContext(context) {
        if (!this.contextDir) {
            throw new Error('工作区未打开，无法保存 Context');
        }

        const filePath = path.join(this.contextDir, `${context.id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(context, null, 2), 'utf8');
    }

    async deleteContext(contextId) {
        if (!this.contextDir) {
            return;
        }

        const filePath = path.join(this.contextDir, `${contextId}.json`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

module.exports = new ContextStorage(); 