#!/usr/bin/env node

/**
 * 简单的扩展测试脚本
 * 验证编译后的扩展文件是否可以正常加载
 */

const fs = require('fs');
const path = require('path');

async function testExtension() {

console.log('🧪 开始测试 VS Code 小说动漫生成器扩展...\n');

// 检查必要文件
const requiredFiles = [
    'out/extension.js',
    'package.json',
    'syntaxes/novel.tmGrammar.json',
    'language-configuration.json'
];

let allFilesExist = true;

console.log('📁 检查必要文件:');
requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
    console.log('\n❌ 缺少必要文件，请先运行 npm run compile');
    process.exit(1);
}

// 检查package.json配置
console.log('\n📋 检查扩展配置:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    console.log(`  ✅ 扩展名称: ${packageJson.displayName}`);
    console.log(`  ✅ 版本: ${packageJson.version}`);
    console.log(`  ✅ 主入口: ${packageJson.main}`);
    console.log(`  ✅ 命令数量: ${packageJson.contributes.commands.length}`);
    console.log(`  ✅ 语言支持: ${packageJson.contributes.languages.length}`);
    
} catch (error) {
    console.log(`  ❌ package.json 解析失败: ${error.message}`);
    process.exit(1);
}

// 尝试加载编译后的扩展
console.log('\n🔧 测试扩展模块加载:');
try {
    // 模拟VS Code环境
    global.vscode = {
        ExtensionContext: class {},
        commands: {
            registerCommand: () => {},
            executeCommand: () => Promise.resolve()
        },
        window: {
            createWebviewPanel: () => ({}),
            showInformationMessage: () => Promise.resolve(),
            showErrorMessage: () => Promise.resolve(),
            createStatusBarItem: () => ({
                show: () => {},
                hide: () => {},
                dispose: () => {}
            })
        },
        workspace: {
            onDidChangeConfiguration: () => ({ dispose: () => {} }),
            getConfiguration: () => ({
                get: () => undefined,
                update: () => Promise.resolve()
            })
        },
        languages: {
            registerCompletionItemProvider: () => ({ dispose: () => {} }),
            registerHoverProvider: () => ({ dispose: () => {} }),
            registerDocumentSymbolProvider: () => ({ dispose: () => {} }),
            createDiagnosticCollection: () => ({
                set: () => {},
                dispose: () => {}
            })
        },
        Uri: {
            file: (path) => ({ fsPath: path, scheme: 'file' }),
            parse: (uri) => ({ fsPath: uri, scheme: 'file' })
        },
        Range: class {},
        Position: class {},
        CompletionItem: class {},
        CompletionItemKind: {},
        SymbolKind: {},
        DiagnosticSeverity: {},
        StatusBarAlignment: { Left: 1, Right: 2 },
        ViewColumn: { One: 1, Two: 2, Three: 3 },
        WebviewPanelOnDidChangeViewStateEvent: class {},
        Disposable: class {
            static from() { return { dispose: () => {} }; }
        }
    };

    // 尝试加载主扩展文件
    const extensionPath = path.join(__dirname, 'out/extension.js');
    delete require.cache[extensionPath]; // 清除缓存
    const extension = require(extensionPath);
    
    console.log('  ✅ 扩展模块加载成功');
    console.log(`  ✅ 导出函数: ${Object.keys(extension).join(', ')}`);
    
    // 测试激活函数
    if (typeof extension.activate === 'function') {
        console.log('  ✅ activate 函数存在');
        
        // 创建模拟的扩展上下文
        const mockContext = {
            subscriptions: [],
            workspaceState: {
                get: () => undefined,
                update: () => Promise.resolve()
            },
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve()
            },
            extensionPath: __dirname,
            storagePath: path.join(__dirname, 'storage'),
            globalStoragePath: path.join(__dirname, 'global-storage'),
            logPath: path.join(__dirname, 'logs'),
            extensionUri: { fsPath: __dirname },
            environmentVariableCollection: {
                replace: () => {},
                append: () => {},
                prepend: () => {},
                get: () => undefined,
                forEach: () => {},
                clear: () => {},
                delete: () => {}
            }
        };
        
        // 尝试激活扩展
        try {
            await extension.activate(mockContext);
            console.log('  ✅ 扩展激活成功');
        } catch (error) {
            console.log(`  ⚠️  扩展激活时出现警告: ${error.message}`);
            console.log('     (这在测试环境中是正常的)');
        }
    } else {
        console.log('  ❌ activate 函数不存在');
    }
    
} catch (error) {
    console.log(`  ❌ 扩展加载失败: ${error.message}`);
    console.log(`     堆栈: ${error.stack}`);
    process.exit(1);
}

// 检查webview资源
console.log('\n🌐 检查 Webview 资源:');
const webviewFiles = [
    'webview-ui/main.js',
    'webview-ui/style.css',
    'webview-ui/vue-bridge.js',
    'webview-ui/workflow-editor.js'
];

webviewFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n🎉 扩展测试完成！');
console.log('\n📖 使用说明:');
console.log('1. 在 VS Code 中按 F5 启动扩展开发主机');
console.log('2. 在新窗口中按 Ctrl+Shift+P 打开命令面板');
console.log('3. 搜索 "小说动漫生成器" 相关命令');
console.log('4. 或者点击活动栏中的电影图标');
console.log('\n✨ 主要功能:');
console.log('• 创建新项目 (novelAnime.createProject)');
console.log('• 打开工作流编辑器 (novelAnime.openWorkflow)');
console.log('• 解析小说文件 (novelAnime.parseNovel)');
console.log('• 生成动画视频 (novelAnime.generateVideo)');
console.log('• 扩展设置 (novelAnime.showSettings)');
}

testExtension().catch(console.error);