# 小说动漫生成器 VS Code 扩展

使用AI技术将小说转换为精美的动画视频的专业VS Code扩展。

## 功能特性

### 🎯 核心功能
- **智能小说解析**: 自动识别章节结构、角色关系和场景描述
- **AI角色分析**: 智能提取角色特征，保持视觉一致性
- **可视化工作流**: 拖拽式工作流编辑器，自定义视频生成流程
- **实时预览**: 即时查看分镜效果和角色设计
- **多格式输出**: 支持MP4、AVI等多种视频格式

### 🛠️ VS Code 集成
- **原生编辑体验**: 在VS Code中直接编辑小说文本
- **智能代码补全**: 角色名称、场景描述的自动补全
- **项目管理**: 完整的项目文件夹结构和版本控制
- **命令面板**: 快速访问所有功能
- **状态栏集成**: 实时显示项目状态和进度

### 🎨 专业工具
- **分镜头脚本**: 自动生成专业的分镜头脚本
- **角色一致性**: AI驱动的角色外观一致性检查
- **场景管理**: 智能场景识别和管理
- **素材库**: 版本控制的素材管理系统

## 安装

1. 打开VS Code
2. 按 `Ctrl+Shift+X` 打开扩展面板
3. 搜索 "小说动漫生成器"
4. 点击安装

## 快速开始

### 创建新项目

1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 "小说动漫生成器: 创建新项目"
3. 选择项目位置并输入项目名称
4. 扩展将自动创建项目结构

### 编辑小说

1. 在项目中创建 `.txt` 或 `.md` 文件
2. 开始编写小说内容
3. 扩展会自动识别章节和角色
4. 使用智能补全功能提高编写效率

### 生成视频

1. 右键点击小说文件
2. 选择 "生成动画视频"
3. 在工作流编辑器中配置生成参数
4. 点击运行开始生成

## 配置

### AI服务配置

```json
{
  "novelAnime.aiService.apiKey": "your-api-key",
  "novelAnime.aiService.endpoint": "https://api.zhipuai.cn/api/paas/v4/",
  "novelAnime.aiService.model": "glm-4"
}
```

### 输出设置

```json
{
  "novelAnime.output.videoFormat": "mp4",
  "novelAnime.output.resolution": "1920x1080",
  "novelAnime.output.frameRate": 30
}
```

## 命令

| 命令 | 快捷键 | 描述 |
|------|--------|------|
| `novelAnime.createProject` | - | 创建新项目 |
| `novelAnime.openProject` | - | 打开现有项目 |
| `novelAnime.openWorkflow` | - | 打开工作流编辑器 |
| `novelAnime.parseNovel` | - | 解析小说文件 |
| `novelAnime.generateVideo` | - | 生成动画视频 |
| `novelAnime.showSettings` | - | 打开扩展设置 |

## 项目结构

```
my-novel-project/
├── novels/                 # 小说文件
│   ├── chapter1.txt
│   └── chapter2.txt
├── characters/             # 角色定义
│   ├── protagonist.json
│   └── supporting.json
├── assets/                 # 素材文件
│   ├── images/
│   ├── audio/
│   └── models/
├── workflows/              # 工作流配置
│   └── default.json
├── output/                 # 生成的视频
└── novel-anime.config.json # 项目配置
```

## 语言支持

扩展为小说文件提供了专门的语言支持：

- **语法高亮**: 章节标题、角色对话、场景描述
- **自动补全**: 角色名称、常用场景描述
- **代码折叠**: 按章节折叠内容
- **大纲视图**: 快速导航章节结构

## 工作流编辑器

可视化的工作流编辑器允许你：

- 拖拽节点创建处理流程
- 连接不同的处理步骤
- 配置每个节点的参数
- 实时预览处理结果
- 保存和分享工作流模板

## 故障排除

### 常见问题

**Q: 扩展无法识别小说文件**
A: 确保文件扩展名为 `.txt` 或 `.md`，并且包含章节标题

**Q: AI服务连接失败**
A: 检查API密钥配置和网络连接

**Q: 视频生成失败**
A: 查看输出面板的错误信息，确保所有依赖项已安装

### 日志查看

1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 "Developer: Show Logs"
3. 选择 "Extension Host"
4. 查找 "小说动漫生成器" 相关日志

## 贡献

欢迎贡献代码和反馈！

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 许可证

MIT License

## 更新日志

### 0.1.0
- 初始版本发布
- 基础项目管理功能
- 小说解析和角色识别
- 工作流编辑器
- VS Code 集成

## 支持

- [GitHub Issues](https://github.com/novel-anime-studio/vscode-extension/issues)
- [文档](https://docs.novel-anime.com)
- [社区论坛](https://community.novel-anime.com)

---

**享受创作的乐趣！** 🎬✨