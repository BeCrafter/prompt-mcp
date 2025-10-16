# MCP Prompt Server

一个基于 Model Context Protocol (MCP) 的智能 Prompt 管理服务器，支持动态加载和执行预设的 AI 提示词。

## 特性

- 🚀 **模块化架构**: 代码结构清晰，易于维护和扩展
- 📝 **智能日志**: 分级日志系统，支持不同级别的日志输出
- 🔧 **配置管理**: 支持环境变量配置，灵活可定制
- ✅ **类型安全**: 使用 Zod 进行严格的参数验证
- 🔄 **热重载**: 支持运行时重新加载 prompts
- 📊 **状态监控**: 提供详细的加载状态和错误信息
- 🎯 **多类型参数**: 支持 string、number、boolean 等参数类型
- 🌐 **远程服务**: 支持从远程服务器加载和处理 prompts
- 🔑 **自定义请求头**: 支持配置远程服务器的请求头信息

## 安装

```bash
# 通过 npm 安装
npm install @becrafter/prompt-mcp

# 或者通过 yarn 安装
yarn add @becrafter/prompt-mcp

# 或者通过 pnpm 安装
pnpm add @becrafter/prompt-mcp

# 启动服务器（使用默认prompts目录）
npm start

# 开发模式（自动重启）
npm run dev

# 查看帮助信息
npm run help

# 查看版本信息
npm run version
```

## 配置

### 命令行参数

服务器支持通过命令行参数指定配置：

```bash
# 指定prompts目录
node src/index.js --prompts-dir /path/to/prompts
node src/index.js -p ./my-prompts

# 使用远程服务器
node src/index.js --remote-url https://api.example.com/prompts
node src/index.js -r https://api.example.com/prompts

# 设置远程服务器请求头
node src/index.js -r https://api.example.com/prompts -H '{"Authorization":"Bearer token"}'

# 查看帮助信息
node src/index.js --help
node src/index.js -h

# 查看版本信息
node src/index.js --version
node src/index.js -v
```

### 环境变量

复制 `env.example` 文件为 `.env` 并根据需要修改：

```bash
cp env.example .env
```

可配置的环境变量：

- `PROMPTS_DIR`: prompts文件所在目录（优先级低于命令行参数）
- `REMOTE_URL`: 远程服务器地址（优先级低于命令行参数）
- `REMOTE_HEADERS`: 远程服务器请求头（JSON格式，优先级低于命令行参数）
- `MCP_SERVER_NAME`: 服务器名称（默认: prompt-mcp）
- `MCP_SERVER_VERSION': 服务器版本（默认: 0.1.0）
- `LOG_LEVEL`: 日志级别（error/warn/info/debug，默认: info）
- `MAX_PROMPTS`: 最大prompt数量限制（默认: 100）

### 配置优先级

1. **命令行参数** (最高优先级)
2. **环境变量**
3. **默认值** (最低优先级)

## 使用方法

### 1. 创建 Prompt 文件

在 `src/prompts/` 目录下创建 YAML 或 JSON 格式的 prompt 文件：

```yaml
name: "代码审查助手"
description: "帮助进行代码审查的AI助手"
messages:
  - role: "user"
    content:
      text: |
        你是一个专业的代码审查助手。请审查以下代码：
        
        代码语言: {{language}}
        代码内容:
        ```
        {{code}}
        ```
        
        请从以下几个方面进行审查：
        1. 代码质量和可读性
        2. 潜在的安全问题
        3. 性能优化建议
        4. 最佳实践建议
        5. 潜在的bug
        
        请提供具体的改进建议和示例代码。
arguments:
  - name: "language"
    description: "编程语言"
    type: "string"
    required: true
  - name: "code"
    description: "要审查的代码"
    type: "string"
    required: true
```

### 2. Prompt 文件格式

每个 prompt 文件必须包含以下字段：

- `name`: prompt 名称（必需）
- `description`: prompt 描述（可选）
- `messages`: 消息数组（可选）
- `arguments`: 参数定义数组（可选）

#### 参数定义

```yaml
arguments:
  - name: "参数名"
    description: "参数描述"
    type: "string"  # string, number, boolean
    required: true   # true/false
```

### 3. 可用工具

服务器启动后，会自动为每个 prompt 创建一个工具，同时提供以下管理工具：

- `reload_prompts`: 重新加载所有 prompts
- `get_prompt_names`: 获取所有可用的 prompt 名称
- `get_prompt_info`: 获取指定 prompt 的详细信息

## 项目结构

```
src/
├── index.js          # 主入口文件
├── config.js         # 配置管理
├── logger.js         # 日志工具
├── promptManager.js  # Prompt 管理器
├── promptProcessor.js # Prompt 处理器
└── prompts/          # Prompt 文件目录
    ├── code-review.yaml
    ├── doc-generator.yaml
    └── error-fixer.yaml
```

## 版本发布

要发布新版本，只需创建一个新的版本标签并推送到 GitHub：

```bash
# 创建新的版本标签（例如：v0.1.0）
git tag v0.1.0

# 推送标签到远程仓库
git push origin v0.1.0
```

在使用自动发布功能之前，您需要配置以下内容：

1. 启用 GitHub Actions 权限：
   - 访问仓库的 Settings -> Actions -> General
   - 在 "Workflow permissions" 部分
   - 选择 "Read and write permissions"
   - 点击 "Save" 保存设置

2. 配置 NPM 令牌：
   - 访问 npmjs.com -> Access Tokens
   - 创建新的令牌（类型选择 Publish）
   - 将令牌添加到仓库的 Secrets（名称：`NPM_TOKEN`）
   - 访问 npmjs.com -> Access Tokens
   - 创建新的令牌（类型选择 Publish）
   - 将令牌添加到仓库的 Secrets

配置完成后，GitHub Actions 将自动：
1. 更新 package.json 中的版本号
2. 更新 env.example 中的版本号
3. 更新 README.md 中的版本信息
4. 发布新版本到 npm 仓库

## 开发

### 代码结构说明

- **Config**: 配置管理类，处理环境变量和目录管理
- **Logger**: 日志工具类，支持分级日志输出
- **PromptManager**: Prompt 管理器，负责加载、验证和管理 prompts
- **PromptProcessor**: Prompt 处理器，负责参数验证和内容处理
- **ArgumentValidator**: 参数验证工具，使用 Zod 进行类型验证

### 错误处理

- 所有操作都有完善的错误处理机制
- 详细的错误日志记录
- 友好的错误信息返回

### 性能优化

- 并行加载 prompt 文件
- 使用 Map 数据结构提高查找效率
- 避免重复的文件读取操作

## 使用示例

### 启动服务器

```bash
# 使用默认prompts目录
npm start

# 指定自定义prompts目录
node src/index.js --prompts-dir /path/to/my/prompts

# 使用远程服务器
node src/index.js -r https://api.example.com/prompts

# 使用远程服务器和自定义请求头
node src/index.js -r https://api.example.com/prompts -H '{"Authorization":"Bearer token"}'

# 使用环境变量
PROMPTS_DIR=/custom/prompts npm start
REMOTE_URL=https://api.example.com/prompts REMOTE_HEADERS='{"key":"value"}' npm start

# 调试模式
LOG_LEVEL=debug node src/index.js -p ./debug-prompts
```

### 使用代码审查助手

```javascript
// 调用代码审查助手
const result = await mcpClient.callTool('代码审查助手', {
  language: 'JavaScript',
  code: 'function add(a, b) { return a + b; }'
});
```

### 重新加载 Prompts

```javascript
// 重新加载所有 prompts
const result = await mcpClient.callTool('reload_prompts', {});
console.log(result.content[0].text);
```

### 获取Prompt信息

```javascript
// 获取所有可用的prompts
const result = await mcpClient.callTool('get_prompt_names', {});

// 获取特定prompt的详细信息
const info = await mcpClient.callTool('get_prompt_info', {
  name: '代码审查助手'
});
```

## 许可证

MIT License