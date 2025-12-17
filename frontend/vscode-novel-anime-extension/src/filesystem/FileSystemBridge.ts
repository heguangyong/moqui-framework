import * as vscode from 'vscode';
import * as chokidar from 'chokidar';
import * as path from 'path';
import { FileSystemAccessError } from '../types';

export class FileSystemBridge {
    private watchers: Map<string, chokidar.FSWatcher> = new Map();
    private disposables: vscode.Disposable[] = [];
    private changeListeners: Map<string, (uri: vscode.Uri, changeType: string) => void> = new Map();
    private securityPolicy: SecurityPolicy;

    constructor(private context: vscode.ExtensionContext) {
        this.securityPolicy = new SecurityPolicy();
    }

    async register(): Promise<void> {
        // 监听工作区文件变化
        this.disposables.push(
            vscode.workspace.onDidSaveTextDocument(this.onDocumentSaved.bind(this))
        );

        this.disposables.push(
            vscode.workspace.onDidCreateFiles(this.onFilesCreated.bind(this))
        );

        this.disposables.push(
            vscode.workspace.onDidDeleteFiles(this.onFilesDeleted.bind(this))
        );

        console.log('文件系统桥接器已注册');
    }

    async readFile(uri: vscode.Uri): Promise<Uint8Array> {
        try {
            return await vscode.workspace.fs.readFile(uri);
        } catch (error) {
            throw new FileSystemAccessError(
                `读取文件失败: ${error instanceof Error ? error.message : String(error)}`,
                uri
            );
        }
    }

    async writeFile(uri: vscode.Uri, content: Uint8Array): Promise<void> {
        try {
            // 确保目录存在
            const directory = vscode.Uri.joinPath(uri, '..');
            try {
                await vscode.workspace.fs.createDirectory(directory);
            } catch {
                // 目录可能已存在
            }

            await vscode.workspace.fs.writeFile(uri, content);
        } catch (error) {
            throw new FileSystemAccessError(
                `写入文件失败: ${error instanceof Error ? error.message : String(error)}`,
                uri
            );
        }
    }

    async createDirectory(uri: vscode.Uri): Promise<void> {
        try {
            await vscode.workspace.fs.createDirectory(uri);
        } catch (error) {
            throw new FileSystemAccessError(
                `创建目录失败: ${error instanceof Error ? error.message : String(error)}`,
                uri
            );
        }
    }

    async deleteFile(uri: vscode.Uri): Promise<void> {
        try {
            await vscode.workspace.fs.delete(uri);
        } catch (error) {
            throw new FileSystemAccessError(
                `删除文件失败: ${error instanceof Error ? error.message : String(error)}`,
                uri
            );
        }
    }

    async copyFile(source: vscode.Uri, destination: vscode.Uri): Promise<void> {
        try {
            await vscode.workspace.fs.copy(source, destination);
        } catch (error) {
            throw new FileSystemAccessError(
                `复制文件失败: ${error instanceof Error ? error.message : String(error)}`,
                source
            );
        }
    }

    async exists(uri: vscode.Uri): Promise<boolean> {
        try {
            await vscode.workspace.fs.stat(uri);
            return true;
        } catch {
            return false;
        }
    }

    async isDirectory(uri: vscode.Uri): Promise<boolean> {
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            return stat.type === vscode.FileType.Directory;
        } catch {
            return false;
        }
    }

    async listDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        try {
            return await vscode.workspace.fs.readDirectory(uri);
        } catch (error) {
            throw new FileSystemAccessError(
                `读取目录失败: ${error instanceof Error ? error.message : String(error)}`,
                uri
            );
        }
    }

    watchFiles(pattern: string, handler: (event: string, path: string) => void): vscode.Disposable {
        const watcher = chokidar.watch(pattern, {
            ignored: /(^|[\/\\])\../, // 忽略隐藏文件
            persistent: true
        });

        const watcherId = `watcher_${Date.now()}_${Math.random()}`;
        this.watchers.set(watcherId, watcher);

        watcher
            .on('add', path => handler('add', path))
            .on('change', path => handler('change', path))
            .on('unlink', path => handler('unlink', path))
            .on('addDir', path => handler('addDir', path))
            .on('unlinkDir', path => handler('unlinkDir', path));

        return new vscode.Disposable(() => {
            watcher.close();
            this.watchers.delete(watcherId);
        });
    }

    private async onDocumentSaved(document: vscode.TextDocument): Promise<void> {
        // 检查是否是小说文件
        const fileExtension = document.fileName.toLowerCase().split('.').pop();
        if (['txt', 'md', 'novel'].includes(fileExtension || '')) {
            console.log(`小说文件已保存: ${document.fileName}`);
            
            // 这里可以触发自动解析
            // 发送消息给 webview 或其他组件
            this.notifyFileChanged(document.uri, 'saved');
        }
    }

    private async onFilesCreated(event: vscode.FileCreateEvent): Promise<void> {
        for (const uri of event.files) {
            console.log(`文件已创建: ${uri.fsPath}`);
            this.notifyFileChanged(uri, 'created');
        }
    }

    private async onFilesDeleted(event: vscode.FileDeleteEvent): Promise<void> {
        for (const uri of event.files) {
            console.log(`文件已删除: ${uri.fsPath}`);
            this.notifyFileChanged(uri, 'deleted');
        }
    }



    async readTextFile(uri: vscode.Uri): Promise<string> {
        const data = await this.readFile(uri);
        return Buffer.from(data).toString('utf8');
    }

    async writeTextFile(uri: vscode.Uri, content: string): Promise<void> {
        const data = Buffer.from(content, 'utf8');
        await this.writeFile(uri, data);
    }

    async readJsonFile<T>(uri: vscode.Uri): Promise<T> {
        const content = await this.readTextFile(uri);
        try {
            return JSON.parse(content);
        } catch (error) {
            throw new FileSystemAccessError(
                `解析JSON文件失败: ${error instanceof Error ? error.message : String(error)}`,
                uri
            );
        }
    }

    async writeJsonFile(uri: vscode.Uri, data: any): Promise<void> {
        const content = JSON.stringify(data, null, 2);
        await this.writeTextFile(uri, content);
    }

    async ensureDirectory(uri: vscode.Uri): Promise<void> {
        if (!(await this.exists(uri))) {
            await this.createDirectory(uri);
        }
    }

    async getFileSize(uri: vscode.Uri): Promise<number> {
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            return stat.size;
        } catch (error) {
            throw new FileSystemAccessError(
                `获取文件大小失败: ${error instanceof Error ? error.message : String(error)}`,
                uri
            );
        }
    }

    async getLastModified(uri: vscode.Uri): Promise<Date> {
        try {
            const stat = await vscode.workspace.fs.stat(uri);
            return new Date(stat.mtime);
        } catch (error) {
            throw new FileSystemAccessError(
                `获取文件修改时间失败: ${error instanceof Error ? error.message : String(error)}`,
                uri
            );
        }
    }

    // 高级文件操作方法
    async moveFile(source: vscode.Uri, destination: vscode.Uri): Promise<void> {
        try {
            this.securityPolicy.validatePath(source);
            this.securityPolicy.validatePath(destination);
            
            await this.copyFile(source, destination);
            await this.deleteFile(source);
        } catch (error) {
            throw new FileSystemAccessError(
                `移动文件失败: ${error instanceof Error ? error.message : String(error)}`,
                source
            );
        }
    }

    async renameFile(uri: vscode.Uri, newName: string): Promise<vscode.Uri> {
        try {
            this.securityPolicy.validatePath(uri);
            this.securityPolicy.validateFileName(newName);
            
            const directory = vscode.Uri.joinPath(uri, '..');
            const newUri = vscode.Uri.joinPath(directory, newName);
            
            await this.moveFile(uri, newUri);
            return newUri;
        } catch (error) {
            throw new FileSystemAccessError(
                `重命名文件失败: ${error instanceof Error ? error.message : String(error)}`,
                uri
            );
        }
    }

    async createFileWithTemplate(uri: vscode.Uri, templateName: string, variables: Record<string, string> = {}): Promise<void> {
        try {
            this.securityPolicy.validatePath(uri);
            
            const template = await this.getTemplate(templateName);
            const content = this.processTemplate(template, variables);
            
            await this.writeTextFile(uri, content);
        } catch (error) {
            throw new FileSystemAccessError(
                `使用模板创建文件失败: ${error instanceof Error ? error.message : String(error)}`,
                uri
            );
        }
    }

    async backupFile(uri: vscode.Uri, backupDir?: vscode.Uri): Promise<vscode.Uri> {
        try {
            this.securityPolicy.validatePath(uri);
            
            const fileName = path.basename(uri.fsPath);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFileName = `${fileName}.backup.${timestamp}`;
            
            const backupDirectory = backupDir || vscode.Uri.joinPath(uri, '..', 'backup');
            await this.ensureDirectory(backupDirectory);
            
            const backupUri = vscode.Uri.joinPath(backupDirectory, backupFileName);
            await this.copyFile(uri, backupUri);
            
            return backupUri;
        } catch (error) {
            throw new FileSystemAccessError(
                `备份文件失败: ${error instanceof Error ? error.message : String(error)}`,
                uri
            );
        }
    }

    async findFiles(pattern: string, rootUri: vscode.Uri, maxResults: number = 100): Promise<vscode.Uri[]> {
        try {
            this.securityPolicy.validatePath(rootUri);
            
            const results: vscode.Uri[] = [];
            await this.searchFiles(rootUri, pattern, results, maxResults);
            
            return results;
        } catch (error) {
            throw new FileSystemAccessError(
                `搜索文件失败: ${error instanceof Error ? error.message : String(error)}`,
                rootUri
            );
        }
    }

    private async searchFiles(dir: vscode.Uri, pattern: string, results: vscode.Uri[], maxResults: number): Promise<void> {
        if (results.length >= maxResults) return;
        
        try {
            const entries = await this.listDirectory(dir);
            
            for (const [name, type] of entries) {
                if (results.length >= maxResults) break;
                
                const entryUri = vscode.Uri.joinPath(dir, name);
                
                if (type === vscode.FileType.File) {
                    if (this.matchesPattern(name, pattern)) {
                        results.push(entryUri);
                    }
                } else if (type === vscode.FileType.Directory && !name.startsWith('.')) {
                    await this.searchFiles(entryUri, pattern, results, maxResults);
                }
            }
        } catch (error) {
            // 忽略无法访问的目录
            console.warn(`无法搜索目录 ${dir.fsPath}: ${error}`);
        }
    }

    private matchesPattern(fileName: string, pattern: string): boolean {
        // 简单的通配符匹配
        const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\?/g, '.'), 'i');
        return regex.test(fileName);
    }

    // 文件监听增强
    addChangeListener(id: string, listener: (uri: vscode.Uri, changeType: string) => void): void {
        this.changeListeners.set(id, listener);
    }

    removeChangeListener(id: string): void {
        this.changeListeners.delete(id);
    }

    private notifyFileChanged(uri: vscode.Uri, changeType: string): void {
        console.log(`文件变化通知: ${changeType} - ${uri.fsPath}`);
        
        // 通知所有监听器
        this.changeListeners.forEach((listener, id) => {
            try {
                listener(uri, changeType);
            } catch (error) {
                console.error(`文件变化监听器 ${id} 执行失败:`, error);
            }
        });
    }

    // 模板系统
    private async getTemplate(templateName: string): Promise<string> {
        const templatePath = vscode.Uri.joinPath(
            this.context.extensionUri, 
            'templates', 
            `${templateName}.template`
        );
        
        try {
            return await this.readTextFile(templatePath);
        } catch {
            // 如果模板文件不存在，返回默认模板
            return this.getDefaultTemplate(templateName);
        }
    }

    private getDefaultTemplate(templateName: string): string {
        const templates: Record<string, string> = {
            'novel': `第一章 {{chapterTitle}}

{{content}}

[场景：{{scene}}]

{{characterName}}："{{dialogue}}"
`,
            'character': `# 角色：{{name}}

## 基本信息
- 姓名：{{name}}
- 年龄：{{age}}
- 性别：{{gender}}

## 外貌特征
{{appearance}}

## 性格特点
{{personality}}

## 背景故事
{{background}}
`,
            'workflow': `{
  "id": "{{id}}",
  "name": "{{name}}",
  "description": "{{description}}",
  "version": "1.0.0",
  "nodes": [],
  "connections": [],
  "settings": {
    "autoSave": true,
    "validateOnRun": true
  }
}`
        };
        
        return templates[templateName] || '{{content}}';
    }

    private processTemplate(template: string, variables: Record<string, string>): string {
        let result = template;
        
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            result = result.replace(new RegExp(placeholder, 'g'), value);
        }
        
        // 清理未替换的占位符
        result = result.replace(/\{\{[^}]+\}\}/g, '');
        
        return result;
    }

    // 文件完整性验证
    async validateFileIntegrity(uri: vscode.Uri): Promise<boolean> {
        try {
            this.securityPolicy.validatePath(uri);
            
            const stat = await vscode.workspace.fs.stat(uri);
            
            // 检查文件大小是否合理
            if (stat.size > 100 * 1024 * 1024) { // 100MB
                console.warn(`文件过大: ${uri.fsPath} (${stat.size} bytes)`);
                return false;
            }
            
            // 检查文件是否可读
            try {
                await this.readFile(uri);
                return true;
            } catch {
                return false;
            }
        } catch {
            return false;
        }
    }

    // 批量操作
    async batchOperation<T>(
        items: T[], 
        operation: (item: T) => Promise<void>,
        options: { concurrency?: number; continueOnError?: boolean } = {}
    ): Promise<{ success: T[]; failed: { item: T; error: Error }[] }> {
        const { concurrency = 5, continueOnError = true } = options;
        const success: T[] = [];
        const failed: { item: T; error: Error }[] = [];
        
        // 分批处理
        for (let i = 0; i < items.length; i += concurrency) {
            const batch = items.slice(i, i + concurrency);
            const promises = batch.map(async (item) => {
                try {
                    await operation(item);
                    success.push(item);
                } catch (error) {
                    const err = error instanceof Error ? error : new Error(String(error));
                    failed.push({ item, error: err });
                    
                    if (!continueOnError) {
                        throw err;
                    }
                }
            });
            
            await Promise.all(promises);
        }
        
        return { success, failed };
    }

    dispose(): void {
        // 关闭所有文件监听器
        this.watchers.forEach(watcher => watcher.close());
        this.watchers.clear();

        // 清理变化监听器
        this.changeListeners.clear();

        // 清理 VS Code 事件监听器
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}

// 安全策略类
class SecurityPolicy {
    private readonly allowedExtensions = new Set([
        '.txt', '.md', '.json', '.xml', '.yml', '.yaml',
        '.js', '.ts', '.html', '.css', '.scss',
        '.jpg', '.jpeg', '.png', '.gif', '.svg',
        '.mp3', '.wav', '.ogg', '.mp4', '.avi', '.mov',
        '.novel', '.character', '.workflow'
    ]);

    private readonly blockedPaths = [
        '/etc', '/usr', '/bin', '/sbin', '/var',
        'C:\\Windows', 'C:\\Program Files', 'C:\\System32'
    ];

    validatePath(uri: vscode.Uri): void {
        const fsPath = uri.fsPath;
        
        // 检查是否在阻止列表中
        for (const blockedPath of this.blockedPaths) {
            if (fsPath.startsWith(blockedPath)) {
                throw new Error(`访问被拒绝: 路径 ${fsPath} 在安全限制范围内`);
            }
        }
        
        // 检查路径遍历攻击
        if (fsPath.includes('..') || fsPath.includes('~')) {
            throw new Error(`访问被拒绝: 路径 ${fsPath} 包含不安全字符`);
        }
    }

    validateFileName(fileName: string): void {
        // 检查文件名是否包含不安全字符
        const unsafeChars = /[<>:"|?*\x00-\x1f]/;
        if (unsafeChars.test(fileName)) {
            throw new Error(`文件名包含不安全字符: ${fileName}`);
        }
        
        // 检查文件扩展名
        const ext = path.extname(fileName).toLowerCase();
        if (ext && !this.allowedExtensions.has(ext)) {
            throw new Error(`不支持的文件类型: ${ext}`);
        }
    }
}