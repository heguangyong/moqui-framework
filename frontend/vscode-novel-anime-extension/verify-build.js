#!/usr/bin/env node

/**
 * 验证扩展构建是否成功
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 验证 VS Code 小说动漫生成器扩展构建状态...\n');

// 检查必要文件
const requiredFiles = [
    'out/extension.js',
    'out/extension.d.ts',
    'package.json',
    'syntaxes/novel.tmGrammar.json',
    'language-configuration.json',
    'webview-ui/main.js',
    'webview-ui/style.css',
    'webview-ui/vue-bridge.js',
    'webview-ui/workflow-editor.js'
];

let allFilesExist = true;

console.log('📁 检查构建文件:');
requiredFiles.forEach(file => {
    const exists = fs.existsSync(path.join(__dirname, file));
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allFilesExist = false;
});

// 检查编译输出目录结构
console.log('\n📂 检查编译输出结构:');
const outDirs = [
    'out/commands',
    'out/config', 
    'out/filesystem',
    'out/language',
    'out/project',
    'out/services',
    'out/types',
    'out/webview'
];

outDirs.forEach(dir => {
    const exists = fs.existsSync(path.join(__dirname, dir));
    console.log(`  ${exists ? '✅' : '❌'} ${dir}/`);
    if (!exists) allFilesExist = false;
});

// 检查package.json配置
console.log('\n📋 验证扩展配置:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    console.log(`  ✅ 扩展ID: ${packageJson.name}`);
    console.log(`  ✅ 显示名称: ${packageJson.displayName}`);
    console.log(`  ✅ 版本: ${packageJson.version}`);
    console.log(`  ✅ 发布者: ${packageJson.publisher}`);
    console.log(`  ✅ VS Code版本要求: ${packageJson.engines.vscode}`);
    console.log(`  ✅ 主入口文件: ${packageJson.main}`);
    
    // 检查贡献点
    const contributes = packageJson.contributes;
    console.log(`  ✅ 命令数量: ${contributes.commands?.length || 0}`);
    console.log(`  ✅ 语言定义: ${contributes.languages?.length || 0}`);
    console.log(`  ✅ 语法高亮: ${contributes.grammars?.length || 0}`);
    console.log(`  ✅ 配置项: ${Object.keys(contributes.configuration?.properties || {}).length}`);
    console.log(`  ✅ 视图容器: ${contributes.viewsContainers?.activitybar?.length || 0}`);
    
} catch (error) {
    console.log(`  ❌ package.json 解析失败: ${error.message}`);
    allFilesExist = false;
}

// 检查TypeScript编译
console.log('\n🔧 检查TypeScript编译:');
try {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
    console.log(`  ✅ 编译目标: ${tsconfig.compilerOptions.target}`);
    console.log(`  ✅ 模块系统: ${tsconfig.compilerOptions.module}`);
    console.log(`  ✅ 输出目录: ${tsconfig.compilerOptions.outDir}`);
    console.log(`  ✅ 严格模式: ${tsconfig.compilerOptions.strict ? '启用' : '禁用'}`);
} catch (error) {
    console.log(`  ❌ tsconfig.json 解析失败: ${error.message}`);
}

// 检查依赖
console.log('\n📦 检查依赖:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};
    
    console.log(`  ✅ 运行时依赖: ${Object.keys(deps).length} 个`);
    Object.keys(deps).forEach(dep => {
        console.log(`    - ${dep}@${deps[dep]}`);
    });
    
    console.log(`  ✅ 开发依赖: ${Object.keys(devDeps).length} 个`);
    console.log(`    - TypeScript: ${devDeps.typescript || '未安装'}`);
    console.log(`    - VS Code类型: ${devDeps['@types/vscode'] || '未安装'}`);
    console.log(`    - ESLint: ${devDeps.eslint || '未安装'}`);
    
} catch (error) {
    console.log(`  ❌ 依赖检查失败: ${error.message}`);
}

// 最终结果
console.log('\n' + '='.repeat(50));
if (allFilesExist) {
    console.log('🎉 构建验证成功！扩展已准备就绪。');
    console.log('\n📖 下一步操作:');
    console.log('1. 在 VS Code 中打开此项目');
    console.log('2. 按 F5 启动扩展开发主机');
    console.log('3. 在新窗口中测试扩展功能');
    console.log('\n🚀 主要命令:');
    console.log('• Ctrl+Shift+P → "小说动漫生成器: 创建新项目"');
    console.log('• Ctrl+Shift+P → "小说动漫生成器: 打开工作流编辑器"');
    console.log('• 点击活动栏中的电影图标');
    
    process.exit(0);
} else {
    console.log('❌ 构建验证失败！请检查上述错误。');
    console.log('\n🔧 建议操作:');
    console.log('1. 运行 npm install 安装依赖');
    console.log('2. 运行 npm run compile 重新编译');
    console.log('3. 检查 TypeScript 错误');
    
    process.exit(1);
}