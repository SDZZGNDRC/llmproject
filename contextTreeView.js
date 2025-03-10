const vscode = require('vscode');
const path = require('path');
const contextManager = require('./contextManager');

class ContextTreeDataProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        
        // 监听 Context 变化
        contextManager.onDidChangeContexts(() => {
            this.refresh();
        });
    }

    refresh() {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    async getChildren(element) {
        if (!element) {
            // 根节点，返回所有 Context
            const contexts = contextManager.getContexts();
            return contexts.map(context => {
                const item = new vscode.TreeItem(context.name);
                item.id = context.id;
                item.contextValue = 'context';
                item.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
                item.tooltip = context.description || '无描述';
                item.iconPath = new vscode.ThemeIcon('notebook');
                return item;
            });
        } else if (element.contextValue === 'context') {
            // Context 节点，返回其包含的文件
            const context = contextManager.getContextById(element.id);
            if (!context) return [];
            
            return context.files.map(file => {
                const fileName = path.basename(file.path);
                const item = new vscode.TreeItem(fileName);
                item.description = path.dirname(file.path);
                item.contextValue = 'contextFile';
                item.tooltip = file.path;
                item.iconPath = vscode.ThemeIcon.File;
                item.id = `${context.id}|${file.path}`;
                item.command = {
                    command: 'vscode.open',
                    arguments: [vscode.Uri.file(path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, file.path))],
                    title: '打开文件'
                };
                return item;
            });
        }
        
        return [];
    }
}

module.exports = ContextTreeDataProvider; 